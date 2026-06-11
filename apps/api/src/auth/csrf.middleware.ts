import { NextFunction, Request, Response } from 'express';
import { getConfig } from '../config/env';
import { CookieService, CSRF_HEADER_NAME } from './cookie.service';

/** PathString.StartsWithSegments semantics: exact match or boundary at '/'. */
function startsWithSegments(path: string, prefix: string): boolean {
  const lowerPath = path.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();
  return lowerPath === lowerPrefix || lowerPath.startsWith(`${lowerPrefix}/`);
}

/** Port of Procraft.Api.Middleware.CsrfMiddleware (double-submit cookie guard). */
export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS' || method === 'HEAD') {
    next();
    return;
  }

  const path = req.path;
  if (
    startsWithSegments(path, '/swagger') ||
    startsWithSegments(path, '/health') ||
    startsWithSegments(path, '/api/admin')
  ) {
    next();
    return;
  }

  if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH' && method !== 'DELETE') {
    next();
    return;
  }

  const config = getConfig();
  const cookieName = config.cookies.csrfCookieName;
  const cookie = (req.cookies ?? {})[cookieName];
  const headerValue = req.headers[CSRF_HEADER_NAME.toLowerCase()];
  const header = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!cookie || cookie.trim() === '' || !header || header.trim() === '') {
    res.status(403).json({
      title: 'CSRF validation failed',
      detail: `Provide ${CSRF_HEADER_NAME} matching ${cookieName} cookie.`,
    });
    return;
  }

  if (cookie !== header) {
    res.status(403).json({ title: 'CSRF token mismatch' });
    return;
  }

  next();
}

/**
 * Port of WebApplicationExtensions.UseIssueCsrfCookieAfterAuth: after a
 * successful (2xx) POST to login/register/refresh (including /verify children),
 * issue the readable CSRF cookie when the request did not already carry one.
 */
export function issueCsrfAfterAuthMiddleware(cookieService: CookieService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isAuthEndpoint =
      req.method.toUpperCase() === 'POST' &&
      (startsWithSegments(req.path, '/api/auth/login') ||
        startsWithSegments(req.path, '/api/auth/register') ||
        startsWithSegments(req.path, '/api/auth/refresh'));

    if (!isAuthEndpoint) {
      next();
      return;
    }

    const config = getConfig();
    const hadCsrfCookie = Object.prototype.hasOwnProperty.call(req.cookies ?? {}, config.cookies.csrfCookieName);

    const originalWriteHead = res.writeHead.bind(res);
    let issued = false;

    res.writeHead = function patchedWriteHead(this: Response, ...args: unknown[]) {
      if (!issued) {
        issued = true;
        const statusCode = typeof args[0] === 'number' ? args[0] : res.statusCode;
        if (statusCode >= 200 && statusCode < 300 && !hadCsrfCookie) {
          cookieService.issueCsrfTokenCookie(res);
        }
      }
      return (originalWriteHead as (...inner: unknown[]) => Response)(...args);
    } as typeof res.writeHead;

    next();
  };
}
