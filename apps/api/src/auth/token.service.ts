import { Injectable } from '@nestjs/common';
import { createHash, createHmac, randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { getConfig } from '../config/env';
import { UserEntity } from '../database/entities';

export interface AccessTokenPayload {
  sub: string;
  nameid: string;
  email: string;
  preferred_username: string;
  unique_name: string;
}

/**
 * Port of Procraft.Infrastructure.Auth.TokenService. The JWT payload mirrors
 * the claims the C# JwtSecurityTokenHandler emitted (sub/nameid/email/
 * preferred_username/unique_name) with the same HS256 signature, issuer and
 * audience — tokens issued by either backend validate on the other.
 */
@Injectable()
export class TokenService {
  createAccessToken(user: Pick<UserEntity, 'id' | 'email' | 'username'>): string {
    const config = getConfig();

    if (!config.jwt.secret) {
      throw new Error('JWT signing secret is not configured (Jwt:Secret or JWT_SECRET).');
    }

    if (config.jwt.secret.length < 32) {
      throw new Error('JWT signing secret must be at least 32 characters.');
    }

    const payload: AccessTokenPayload = {
      sub: user.id,
      nameid: user.id,
      email: user.email,
      preferred_username: user.username,
      unique_name: user.username,
    };

    return jwt.sign(payload, config.jwt.secret, {
      algorithm: 'HS256',
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      expiresIn: config.jwt.accessTokenMinutes * 60,
      notBefore: 0,
    });
  }

  /**
   * Validates an access token (HS256, issuer, audience, lifetime with the same
   * 60s clock skew the C# TokenValidationParameters allowed) and returns the
   * user identity claims, or null when invalid.
   */
  validateAccessToken(token: string): { userId: string; email: string; username: string } | null {
    const config = getConfig();

    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256'],
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
        clockTolerance: 60,
      }) as jwt.JwtPayload;

      const userId = readClaim(decoded, 'nameid') ?? readClaim(decoded, 'sub');
      if (!userId || !isUuidLike(userId)) {
        return null;
      }

      return {
        userId,
        email: readClaim(decoded, 'email') ?? '',
        username: readClaim(decoded, 'unique_name') ?? readClaim(decoded, 'preferred_username') ?? '',
      };
    } catch {
      return null;
    }
  }

  generateRefreshPlaintext(sizeBytes = 48): string {
    return randomBytes(sizeBytes).toString('base64');
  }

  /** SHA256 over UTF-8, uppercase hex — identical to Convert.ToHexString(SHA256.HashData(...)). */
  hashRefreshToken(plaintextRefreshToken: string): string {
    return createHash('sha256').update(plaintextRefreshToken, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * HMACSHA256(secret, "{guidN}:{code}") uppercase hex — identical to the
   * verification-code hashing in the C# Register/Login/Reset handlers.
   */
  hashVerificationCode(id: string, code: string): string {
    const config = getConfig();
    if (!config.jwt.secret) {
      throw new Error('JWT signing secret is not configured (Jwt:Secret or JWT_SECRET).');
    }

    const guidN = id.replace(/-/g, '').toLowerCase();
    return createHmac('sha256', Buffer.from(config.jwt.secret, 'utf8'))
      .update(Buffer.from(`${guidN}:${code}`, 'utf8'))
      .digest('hex')
      .toUpperCase();
  }
}

function readClaim(payload: jwt.JwtPayload, name: string): string | undefined {
  const value = payload[name];
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }
  return undefined;
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
