import { Request } from 'express';

/** Port of Procraft.Infrastructure.Services.RequestContextService. */

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const headerValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  if (headerValue && headerValue.trim() !== '') {
    const first = headerValue
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)[0];
    if (first) {
      return first;
    }
  }

  return req.socket?.remoteAddress ?? null;
}

export function getUserAgent(req: Request): string | null {
  const value = req.headers['user-agent'];
  return typeof value === 'string' ? value : null;
}

export function getPublicOrigin(req: Request): string | null {
  const host = req.headers.host;
  if (!host) {
    return null;
  }

  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader)?.split(',')[0]?.trim() || req.protocol;
  return `${proto}://${host}`;
}
