import { CanActivate, ExecutionContext, Injectable, createParamDecorator } from '@nestjs/common';
import { Request } from 'express';
import { getConfig } from '../config/env';
import { UnauthorizedException } from '../common/exceptions';
import { TokenService } from './token.service';

export interface CurrentUser {
  userId: string;
  email: string;
  username: string;
}

declare module 'express' {
  interface Request {
    currentUser?: CurrentUser;
  }
}

/**
 * Cookie-or-bearer JWT authentication mirroring the C# JwtBearer setup:
 * Authorization header wins, then the configured access cookie. Challenge
 * responses are 401 {"message":"Not authenticated."}.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = resolveCurrentUser(request, this.tokenService);

    if (!user) {
      throw new UnauthorizedException('Not authenticated.');
    }

    request.currentUser = user;
    return true;
  }
}

export function resolveCurrentUser(request: Request, tokenService: TokenService): CurrentUser | null {
  const token = extractToken(request);
  if (!token) {
    return null;
  }

  return tokenService.validateAccessToken(token);
}

function extractToken(request: Request): string | null {
  const header = request.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const value = header.slice('Bearer '.length).trim();
    if (value.length > 0) {
      return value;
    }
  }

  const config = getConfig();
  const cookie = (request.cookies ?? {})[config.cookies.accessCookieName];
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : null;
}

export const ReqUser = createParamDecorator((_data: unknown, context: ExecutionContext): CurrentUser => {
  const request = context.switchToHttp().getRequest<Request>();
  if (!request.currentUser) {
    throw new UnauthorizedException('Not authenticated.');
  }
  return request.currentUser;
});
