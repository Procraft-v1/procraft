import { Body, Controller, Delete, Get, HttpCode, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { toDateTimeOffsetString } from '../common/dates';
import { Validator, isUuid } from '../common/validation';
import { AuthService } from './auth.service';
import { CookieService } from './cookie.service';
import { CurrentUser, JwtAuthGuard, ReqUser } from './jwt-auth.guard';

interface RegisterBody {
  email?: string;
  username?: string;
  password?: string;
  phoneNumber?: string | null;
}

interface VerifyBody {
  verificationId?: string;
  code?: string;
}

interface LoginBody {
  emailOrUsername?: string;
  password?: string;
}

interface ForgotPasswordBody {
  email?: string;
}

interface ResetPasswordBody {
  resetId?: string;
  code?: string;
  newPassword?: string;
}

interface UpdateAccountBody {
  email?: string;
  username?: string;
  phoneNumber?: string | null;
}

const USERNAME_PATTERN = /^[a-z0-9_-]+$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]{7,32}$/;
const CODE_PATTERN = /^\d{4}$/;

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function validateEmailUsernamePassword(body: RegisterBody, includePassword: boolean): void {
  const validator = new Validator();

  validator.ruleFor('Email', str(body.email)).notEmpty().emailAddress();

  validator
    .ruleFor('Username', str(body.username))
    .notEmpty()
    .minimumLength(3)
    .maximumLength(30)
    .matches(USERNAME_PATTERN)
    .withMessage('Username may only contain lowercase letters, digits, hyphen, or underscore.');

  if (includePassword) {
    validator.ruleFor('Password', str(body.password)).notEmpty().minimumLength(8).maximumLength(100);
  }

  const phone = str(body.phoneNumber);
  if (phone && phone.trim() !== '') {
    validator
      .ruleFor('PhoneNumber', phone)
      .maximumLength(32)
      .matches(PHONE_PATTERN)
      .withMessage('Phone number may contain digits, spaces, plus, dots, hyphen, or parentheses.');
  }

  validator.throwIfInvalid();
}

function validateVerify(body: VerifyBody, codeMessage?: string): void {
  const validator = new Validator();

  const idRule = validator.ruleFor('VerificationId', str(body.verificationId)).notEmpty();
  if (body.verificationId && !isUuid(body.verificationId)) {
    idRule.guid();
  }

  const codeRule = validator.ruleFor('Code', str(body.code)).notEmpty().matches(CODE_PATTERN);
  if (codeMessage) {
    codeRule.withMessage(codeMessage);
  }

  validator.throwIfInvalid();
}

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Get('csrf')
  @HttpCode(204)
  csrf(@Res({ passthrough: true }) res: Response): void {
    this.cookieService.issueCsrfTokenCookie(res);
  }

  @Post('register')
  @HttpCode(200)
  async register(@Req() req: Request, @Body() body: RegisterBody) {
    validateEmailUsernamePassword(body, true);

    const result = await this.authService.register(
      req,
      body.email!,
      body.username!,
      body.password!,
      str(body.phoneNumber),
    );

    return {
      verificationId: result.verificationId,
      maskedEmail: result.maskedEmail,
      expiresAt: toDateTimeOffsetString(result.expiresAt),
      codeLength: result.codeLength,
    };
  }

  @Post('register/verify')
  @HttpCode(200)
  async verifyRegister(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: VerifyBody,
  ) {
    validateVerify(body, 'Code must be 4 digits.');
    const user = await this.authService.verifyRegister(req, res, body.verificationId!, body.code!);
    return { user };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: LoginBody) {
    const validator = new Validator();
    validator
      .ruleFor('EmailOrUsername', str(body.emailOrUsername))
      .notEmpty()
      .must((value) => typeof value === 'string' && value.trim().length > 0);
    validator.ruleFor('Password', str(body.password)).notEmpty();
    validator.throwIfInvalid();

    const user = await this.authService.login(req, res, body.emailOrUsername!, body.password!);
    return { user };
  }

  @Post('login/verify')
  @HttpCode(200)
  async verifyLogin(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: VerifyBody) {
    validateVerify(body);
    const user = await this.authService.verifyLogin(req, res, body.verificationId!, body.code!);
    return { user };
  }

  @Post('password/forgot')
  @HttpCode(200)
  async forgotPassword(@Req() req: Request, @Body() body: ForgotPasswordBody) {
    const validator = new Validator();
    validator.ruleFor('Email', str(body.email)).notEmpty().emailAddress();
    validator.throwIfInvalid();

    const result = await this.authService.requestPasswordReset(req, body.email!);
    return {
      resetId: result.resetId,
      maskedEmail: result.maskedEmail,
      expiresAt: toDateTimeOffsetString(result.expiresAt),
      codeLength: result.codeLength,
    };
  }

  @Post('password/reset')
  @HttpCode(200)
  async resetPassword(@Body() body: ResetPasswordBody) {
    const validator = new Validator();
    const idRule = validator.ruleFor('ResetId', str(body.resetId)).notEmpty();
    if (body.resetId && !isUuid(body.resetId)) {
      idRule.guid();
    }
    validator.ruleFor('Code', str(body.code)).notEmpty().matches(CODE_PATTERN);
    validator.ruleFor('NewPassword', str(body.newPassword)).notEmpty().minimumLength(8).maximumLength(100);
    validator.throwIfInvalid();

    const result = await this.authService.resetPassword(body.resetId!, body.code!, body.newPassword!);
    return { message: result.message };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@ReqUser() current: CurrentUser) {
    const user = await this.authService.me(current);
    return { user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.refresh(req, res);
    return { user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(req, res);
    return { message: result.message };
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Res({ passthrough: true }) res: Response, @ReqUser() current: CurrentUser) {
    const result = await this.authService.deleteAccount(res, current);
    return { message: result.message };
  }

  @Put('account')
  @UseGuards(JwtAuthGuard)
  async updateAccount(@ReqUser() current: CurrentUser, @Body() body: UpdateAccountBody) {
    validateEmailUsernamePassword(body as RegisterBody, false);
    const user = await this.authService.updateAccount(current, body.email!, body.username!, str(body.phoneNumber));
    return { user };
  }
}
