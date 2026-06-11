import { Injectable } from '@nestjs/common';
import { CookieOptions, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { getConfig, parseSameSite } from '../config/env';

export const CSRF_HEADER_NAME = 'X-CSRF-TOKEN';

/**
 * Port of Procraft.Infrastructure.Auth.CookieService and
 * Procraft.Api.Extensions.CookieExtensions: identical cookie names, flags,
 * lifetimes and CSRF token format (uppercase hex, 32 chars).
 */
@Injectable()
export class CookieService {
  appendAccessToken(res: Response, jwt: string): void {
    if (!jwt || jwt.trim() === '') {
      return;
    }

    const config = getConfig();
    const expires = new Date(Date.now() + config.jwt.accessTokenMinutes * 60_000);
    res.cookie(config.cookies.accessCookieName, jwt, this.buildOptions(expires));
  }

  appendRefreshToken(res: Response, plaintextRefreshToken: string): void {
    if (!plaintextRefreshToken || plaintextRefreshToken.trim() === '') {
      return;
    }

    const config = getConfig();
    const expires = new Date(Date.now() + config.jwt.refreshTokenDays * 86_400_000);
    res.cookie(config.cookies.refreshCookieName, plaintextRefreshToken, this.buildOptions(expires));
  }

  getPlainRefreshToken(req: Request): string | null {
    const config = getConfig();
    const value = (req.cookies ?? {})[config.cookies.refreshCookieName];
    return typeof value === 'string' ? value : null;
  }

  clearAuthCookies(res: Response): void {
    const config = getConfig();
    const options = this.buildOptions();
    res.clearCookie(config.cookies.accessCookieName, options);
    res.clearCookie(config.cookies.refreshCookieName, options);
  }

  /** Non-HttpOnly double-submit CSRF cookie (hex of 16 random bytes, uppercase). */
  issueCsrfTokenCookie(res: Response): void {
    const config = getConfig();
    const token = randomBytes(16).toString('hex').toUpperCase();

    const options: CookieOptions = {
      httpOnly: false,
      secure: config.cookies.secure,
      sameSite: parseSameSite(config.cookies.sameSite),
      path: '/',
    };

    if (config.cookies.csrfCookieDomain && config.cookies.csrfCookieDomain.trim() !== '') {
      options.domain = config.cookies.csrfCookieDomain;
    }

    res.cookie(config.cookies.csrfCookieName, token, options);
  }

  private buildOptions(expires?: Date): CookieOptions {
    const config = getConfig();

    const options: CookieOptions = {
      httpOnly: true,
      secure: config.cookies.secure,
      sameSite: parseSameSite(config.cookies.sameSite),
      path: '/',
    };

    if (expires) {
      options.expires = expires;
      options.maxAge = expires.getTime() - Date.now();
    }

    return options;
  }
}
