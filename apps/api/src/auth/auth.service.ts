import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { randomInt, randomUUID, timingSafeEqual } from 'crypto';
import { Request, Response } from 'express';
import {
  LoginVerificationCodeEntity,
  PasswordResetCodeEntity,
  PendingRegistrationEntity,
  RefreshTokenEntity,
  UserEntity,
} from '../database/entities';
import { ConflictException, UnauthorizedException } from '../common/exceptions';
import { getClientIp, getUserAgent } from '../common/request-context';
import { getConfig } from '../config/env';
import { EmailService } from '../email/email.service';
import { CookieService } from './cookie.service';
import { PasswordHasher } from './password-hasher';
import { TokenService } from './token.service';
import { CurrentUser } from './jwt-auth.guard';

const CODE_LENGTH = 4;
const CODE_EXPIRES_IN_MINUTES = 5;
const MAX_ATTEMPTS = 5;

export interface AuthUserDto {
  id: string;
  email: string;
  username: string;
  phoneNumber: string | null;
  isEmailConfirmed: boolean;
}

function toAuthUserDto(user: UserEntity): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    phoneNumber: user.phoneNumber ?? null,
    isEmailConfirmed: user.isEmailConfirmed,
  };
}

function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 1) {
    return email;
  }
  return `${email[0]}***${email.slice(at)}`;
}

function normalizePhoneNumber(phoneNumber: string | null | undefined): string | null {
  const trimmed = phoneNumber?.trim();
  return !trimmed || trimmed === '' ? null : trimmed;
}

function generateCode(): string {
  return randomInt(0, 10_000).toString().padStart(CODE_LENGTH, '0');
}

function fixedTimeEqualsHex(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left, 'hex');
  const rightBytes = Buffer.from(right, 'hex');
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

@Injectable()
export class AuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly emailService: EmailService,
  ) {}

  /** RegisterCommandHandler port: pending registration + emailed 4-digit code. */
  async register(
    req: Request,
    email: string,
    username: string,
    password: string,
    phoneNumber: string | null,
  ): Promise<{ verificationId: string; maskedEmail: string; expiresAt: Date; codeLength: number }> {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const users = this.dataSource.getRepository(UserEntity);

    if (await users.exists({ where: { email: normalizedEmail } })) {
      throw new ConflictException({ email: ['Email is already taken'] });
    }

    if (await users.exists({ where: { username: normalizedUsername } })) {
      throw new ConflictException({ username: ['Username is already taken'] });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRES_IN_MINUTES * 60_000);
    const verificationId = randomUUID();
    const code = generateCode();

    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(PendingRegistrationEntity)
        .set({ consumedAt: now, updatedAt: now })
        .where('"ConsumedAt" IS NULL AND "ExpiresAt" > :now AND ("Email" = :email OR "Username" = :username)', {
          now,
          email: normalizedEmail,
          username: normalizedUsername,
        })
        .execute();

      await manager.getRepository(PendingRegistrationEntity).insert({
        id: verificationId,
        email: normalizedEmail,
        username: normalizedUsername,
        phoneNumber: normalizedPhone,
        passwordHash: this.passwordHasher.hash(password),
        codeHash: this.tokenService.hashVerificationCode(verificationId, code),
        expiresAt,
        consumedAt: null,
        attemptCount: 0,
        createdByIp: getClientIp(req),
        userAgent: getUserAgent(req),
        createdAt: now,
        updatedAt: null,
      });
    });

    await this.emailService.send(
      normalizedEmail,
      "Procraft ro'yxatdan o'tish kodi",
      `Procraft account yaratish kodi: ${code}\nKod ${CODE_EXPIRES_IN_MINUTES} daqiqa amal qiladi.`,
    );

    return {
      verificationId,
      maskedEmail: maskEmail(normalizedEmail),
      expiresAt,
      codeLength: CODE_LENGTH,
    };
  }

  /** VerifyRegisterCommandHandler port: code check, user + refresh creation in one transaction. */
  async verifyRegister(req: Request, res: Response, verificationId: string, code: string): Promise<AuthUserDto> {
    const now = new Date();
    const registrations = this.dataSource.getRepository(PendingRegistrationEntity);
    const registration = await registrations.findOne({ where: { id: verificationId } });

    if (!registration || registration.consumedAt || registration.expiresAt <= now) {
      throw new UnauthorizedException('Register verification code is invalid or expired.');
    }

    if (registration.attemptCount >= MAX_ATTEMPTS) {
      await registrations.update({ id: registration.id }, { consumedAt: now, updatedAt: now });
      throw new UnauthorizedException('Too many register verification attempts.');
    }

    const submittedHash = this.tokenService.hashVerificationCode(registration.id, code);
    if (!fixedTimeEqualsHex(registration.codeHash, submittedHash)) {
      const attemptCount = registration.attemptCount + 1;
      await registrations.update(
        { id: registration.id },
        {
          attemptCount,
          updatedAt: now,
          ...(attemptCount >= MAX_ATTEMPTS ? { consumedAt: now } : {}),
        },
      );
      throw new UnauthorizedException('Register verification code is invalid or expired.');
    }

    const users = this.dataSource.getRepository(UserEntity);

    if (await users.exists({ where: { email: registration.email } })) {
      await registrations.update({ id: registration.id }, { consumedAt: now, updatedAt: now });
      throw new ConflictException({ email: ['Email is already taken'] });
    }

    if (await users.exists({ where: { username: registration.username } })) {
      await registrations.update({ id: registration.id }, { consumedAt: now, updatedAt: now });
      throw new ConflictException({ username: ['Username is already taken'] });
    }

    const user: UserEntity = {
      id: randomUUID(),
      email: registration.email,
      username: registration.username,
      phoneNumber: registration.phoneNumber,
      passwordHash: registration.passwordHash,
      isEmailConfirmed: true,
      createdAt: now,
      updatedAt: null,
    };

    const refreshPlain = this.tokenService.generateRefreshPlaintext();

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(UserEntity).insert(user);
      await this.insertRefreshToken(manager, req, user.id, refreshPlain, now);
      await manager
        .getRepository(PendingRegistrationEntity)
        .update({ id: registration.id }, { consumedAt: now, updatedAt: now });
    });

    this.issueAuthCookies(res, user, refreshPlain);
    return toAuthUserDto(user);
  }

  /** LoginCommandHandler port: direct login with refresh-token issuance. */
  async login(req: Request, res: Response, emailOrUsername: string, password: string): Promise<AuthUserDto> {
    const key = emailOrUsername.trim().toLowerCase();

    const user = await this.dataSource
      .getRepository(UserEntity)
      .createQueryBuilder('u')
      .where('u."Email" = :key OR u."Username" = :key', { key })
      .getOne();

    if (!user || !this.passwordHasher.verify(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException('Email is not confirmed.');
    }

    const now = new Date();
    const refreshPlain = this.tokenService.generateRefreshPlaintext();

    await this.dataSource.transaction(async (manager) => {
      await this.insertRefreshToken(manager, req, user.id, refreshPlain, now);
    });

    this.issueAuthCookies(res, user, refreshPlain);
    return toAuthUserDto(user);
  }

  /** VerifyLoginCommandHandler port (legacy email-code login flow). */
  async verifyLogin(req: Request, res: Response, verificationId: string, code: string): Promise<AuthUserDto> {
    const now = new Date();

    const repository = this.dataSource.getRepository(LoginVerificationCodeEntity);
    const verification = await repository.findOne({
      where: { id: verificationId },
      relations: { user: true },
    });

    if (!verification || verification.consumedAt || verification.expiresAt <= now) {
      throw new UnauthorizedException('Login verification code is invalid or expired.');
    }

    if (verification.attemptCount >= MAX_ATTEMPTS) {
      await repository.update({ id: verification.id }, { consumedAt: now, updatedAt: now });
      throw new UnauthorizedException('Too many login verification attempts.');
    }

    const submittedHash = this.tokenService.hashVerificationCode(verification.id, code);
    if (!fixedTimeEqualsHex(verification.codeHash, submittedHash)) {
      const attemptCount = verification.attemptCount + 1;
      await repository.update(
        { id: verification.id },
        {
          attemptCount,
          updatedAt: now,
          ...(attemptCount >= MAX_ATTEMPTS ? { consumedAt: now } : {}),
        },
      );
      throw new UnauthorizedException('Login verification code is invalid or expired.');
    }

    const user = verification.user!;
    const refreshPlain = this.tokenService.generateRefreshPlaintext();

    await this.dataSource.transaction(async (manager) => {
      await manager
        .getRepository(LoginVerificationCodeEntity)
        .update({ id: verification.id }, { consumedAt: now, updatedAt: now });
      await this.insertRefreshToken(manager, req, user.id, refreshPlain, now);
    });

    this.issueAuthCookies(res, user, refreshPlain);
    return toAuthUserDto(user);
  }

  /** RequestPasswordResetCommandHandler port — never reveals whether the email exists. */
  async requestPasswordReset(
    req: Request,
    email: string,
  ): Promise<{ resetId: string; maskedEmail: string; expiresAt: Date; codeLength: number }> {
    const normalizedEmail = email.trim().toLowerCase();
    const resetId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CODE_EXPIRES_IN_MINUTES * 60_000);

    const user = await this.dataSource.getRepository(UserEntity).findOne({ where: { email: normalizedEmail } });

    if (user) {
      const code = generateCode();

      await this.dataSource.transaction(async (manager) => {
        await manager
          .createQueryBuilder()
          .update(PasswordResetCodeEntity)
          .set({ consumedAt: now, updatedAt: now })
          .where('"UserId" = :userId AND "ConsumedAt" IS NULL AND "ExpiresAt" > :now', { userId: user.id, now })
          .execute();

        await manager.getRepository(PasswordResetCodeEntity).insert({
          id: resetId,
          userId: user.id,
          codeHash: this.tokenService.hashVerificationCode(resetId, code),
          expiresAt,
          consumedAt: null,
          attemptCount: 0,
          createdByIp: getClientIp(req),
          userAgent: getUserAgent(req),
          createdAt: now,
          updatedAt: null,
        });
      });

      await this.emailService.send(
        user.email,
        'Procraft parolni tiklash kodi',
        `Procraft parolingizni tiklash kodi: ${code}\nKod ${CODE_EXPIRES_IN_MINUTES} daqiqa amal qiladi.`,
      );
    }

    return {
      resetId,
      maskedEmail: maskEmail(normalizedEmail),
      expiresAt,
      codeLength: CODE_LENGTH,
    };
  }

  /** ResetPasswordCommandHandler port: code check, password update, revoke all refresh sessions. */
  async resetPassword(resetId: string, code: string, newPassword: string): Promise<{ message: string }> {
    const now = new Date();
    const resets = this.dataSource.getRepository(PasswordResetCodeEntity);
    const resetCode = await resets.findOne({ where: { id: resetId }, relations: { user: true } });

    if (!resetCode || resetCode.consumedAt || resetCode.expiresAt <= now) {
      throw new UnauthorizedException('Password reset code is invalid or expired.');
    }

    if (resetCode.attemptCount >= MAX_ATTEMPTS) {
      await resets.update({ id: resetCode.id }, { consumedAt: now, updatedAt: now });
      throw new UnauthorizedException('Too many password reset attempts.');
    }

    const submittedHash = this.tokenService.hashVerificationCode(resetCode.id, code);
    if (!fixedTimeEqualsHex(resetCode.codeHash, submittedHash)) {
      const attemptCount = resetCode.attemptCount + 1;
      await resets.update(
        { id: resetCode.id },
        {
          attemptCount,
          updatedAt: now,
          ...(attemptCount >= MAX_ATTEMPTS ? { consumedAt: now } : {}),
        },
      );
      throw new UnauthorizedException('Password reset code is invalid or expired.');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(UserEntity).update(
        { id: resetCode.userId },
        {
          passwordHash: this.passwordHasher.hash(newPassword),
          updatedAt: now,
        },
      );

      await manager.getRepository(PasswordResetCodeEntity).update({ id: resetCode.id }, { consumedAt: now, updatedAt: now });

      await manager
        .createQueryBuilder()
        .update(RefreshTokenEntity)
        .set({ revokedAt: now, updatedAt: now })
        .where('"UserId" = :userId AND "RevokedAt" IS NULL', { userId: resetCode.userId })
        .execute();
    });

    return { message: 'Password reset successfully.' };
  }

  /** MeQueryHandler port. */
  async me(current: CurrentUser): Promise<AuthUserDto> {
    const user = await this.dataSource.getRepository(UserEntity).findOne({ where: { id: current.userId } });

    if (!user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    return toAuthUserDto(user);
  }

  /** RefreshTokenCommandHandler port: rotation with reuse detection. */
  async refresh(req: Request, res: Response): Promise<AuthUserDto> {
    const plain = this.cookieService.getPlainRefreshToken(req);
    if (!plain || plain.trim() === '') {
      throw new UnauthorizedException('Missing refresh token.');
    }

    const hash = this.tokenService.hashRefreshToken(plain);
    const tokens = this.dataSource.getRepository(RefreshTokenEntity);
    const stored = await tokens.findOne({ where: { tokenHash: hash }, relations: { user: true } });

    if (!stored) {
      throw new UnauthorizedException('Refresh token is invalid.');
    }

    const now = new Date();

    if (stored.revokedAt) {
      await tokens
        .createQueryBuilder()
        .update(RefreshTokenEntity)
        .set({ revokedAt: now, updatedAt: now })
        .where('"UserId" = :userId AND "RevokedAt" IS NULL', { userId: stored.userId })
        .execute();
      throw new UnauthorizedException('Refresh token reuse detected.');
    }

    if (now >= stored.expiresAt) {
      await tokens.update(
        { id: stored.id },
        { revokedAt: now, revokedByIp: getClientIp(req), updatedAt: now },
      );
      throw new UnauthorizedException('Refresh token expired.');
    }

    const config = getConfig();
    const replacementPlain = this.tokenService.generateRefreshPlaintext();
    const replacementHash = this.tokenService.hashRefreshToken(replacementPlain);

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(RefreshTokenEntity).update(
        { id: stored.id },
        {
          revokedAt: now,
          revokedByIp: getClientIp(req),
          replacedByTokenHash: replacementHash,
          updatedAt: now,
        },
      );

      await manager.getRepository(RefreshTokenEntity).insert({
        id: randomUUID(),
        userId: stored.userId,
        tokenHash: replacementHash,
        expiresAt: new Date(now.getTime() + config.jwt.refreshTokenDays * 86_400_000),
        revokedAt: null,
        replacedByTokenHash: null,
        createdByIp: getClientIp(req),
        revokedByIp: null,
        userAgent: getUserAgent(req),
        createdAt: now,
        updatedAt: null,
      });
    });

    this.issueAuthCookies(res, stored.user!, replacementPlain);
    return toAuthUserDto(stored.user!);
  }

  /** LogoutCommandHandler port. */
  async logout(req: Request, res: Response): Promise<{ message: string }> {
    const plain = this.cookieService.getPlainRefreshToken(req);

    if (plain && plain.trim() !== '') {
      const hash = this.tokenService.hashRefreshToken(plain);
      const tokens = this.dataSource.getRepository(RefreshTokenEntity);
      const token = await tokens.findOne({ where: { tokenHash: hash } });

      if (token && !token.revokedAt) {
        const now = new Date();
        await tokens.update(
          { id: token.id },
          { revokedAt: now, revokedByIp: getClientIp(req), updatedAt: now },
        );
      }
    }

    this.cookieService.clearAuthCookies(res);
    return { message: 'Logged out successfully' };
  }

  /** DeleteAccountCommandHandler port — FK cascades remove all owned rows. */
  async deleteAccount(res: Response, current: CurrentUser): Promise<{ message: string }> {
    const users = this.dataSource.getRepository(UserEntity);
    const user = await users.findOne({ where: { id: current.userId } });

    if (!user) {
      this.cookieService.clearAuthCookies(res);
      throw new UnauthorizedException('Not authenticated.');
    }

    await users.delete({ id: user.id });
    this.cookieService.clearAuthCookies(res);

    return { message: 'Account deleted successfully' };
  }

  /** UpdateAccountCommandHandler port. */
  async updateAccount(
    current: CurrentUser,
    email: string,
    username: string,
    phoneNumber: string | null,
  ): Promise<AuthUserDto> {
    const users = this.dataSource.getRepository(UserEntity);
    const user = await users.findOne({ where: { id: current.userId } });

    if (!user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    const emailTaken = await users
      .createQueryBuilder('u')
      .where('u."Id" != :id AND u."Email" = :email', { id: user.id, email: normalizedEmail })
      .getExists();
    if (emailTaken) {
      throw new ConflictException({ email: ['Email is already taken'] });
    }

    const usernameTaken = await users
      .createQueryBuilder('u')
      .where('u."Id" != :id AND u."Username" = :username', { id: user.id, username: normalizedUsername })
      .getExists();
    if (usernameTaken) {
      throw new ConflictException({ username: ['Username is already taken'] });
    }

    user.email = normalizedEmail;
    user.username = normalizedUsername;
    user.phoneNumber = normalizedPhone;
    user.updatedAt = new Date();

    await users.update(
      { id: user.id },
      {
        email: user.email,
        username: user.username,
        phoneNumber: user.phoneNumber,
        updatedAt: user.updatedAt,
      },
    );

    return toAuthUserDto(user);
  }

  private async insertRefreshToken(
    manager: EntityManager,
    req: Request,
    userId: string,
    refreshPlain: string,
    now: Date,
  ): Promise<void> {
    const config = getConfig();
    await manager.getRepository(RefreshTokenEntity).insert({
      id: randomUUID(),
      userId,
      tokenHash: this.tokenService.hashRefreshToken(refreshPlain),
      expiresAt: new Date(now.getTime() + config.jwt.refreshTokenDays * 86_400_000),
      revokedAt: null,
      replacedByTokenHash: null,
      createdByIp: getClientIp(req),
      revokedByIp: null,
      userAgent: getUserAgent(req),
      createdAt: now,
      updatedAt: null,
    });
  }

  private issueAuthCookies(res: Response, user: UserEntity, refreshPlain: string): void {
    const access = this.tokenService.createAccessToken(user);
    this.cookieService.appendAccessToken(res, access);
    this.cookieService.appendRefreshToken(res, refreshPlain);
  }
}

