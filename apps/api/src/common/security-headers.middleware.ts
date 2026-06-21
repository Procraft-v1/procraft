import { NextFunction, Request, Response } from 'express';
import { getConfig } from '../config/env';

/**
 * Adds conservative security response headers. Only headers that cannot affect
 * legitimate JSON/asset responses are set here:
 *
 * - X-Content-Type-Options: nosniff — stops MIME sniffing of uploaded files
 *   (which are served from /uploads with extension-derived content types).
 * - Referrer-Policy — trims the referrer leaked to outbound links.
 * - X-Frame-Options: DENY — the JSON API is never meant to be framed. Skipped
 *   for /uploads so an uploaded image/PDF can still be embedded if a template
 *   ever needs it.
 * - Strict-Transport-Security — production only (TLS is terminated upstream),
 *   so it is never sent over the plain-HTTP dev listener.
 *
 * No Content-Security-Policy is set here on purpose: the API returns JSON, and
 * a wrong CSP would risk breaking Swagger UI / embedded assets. CSP belongs on
 * the HTML-serving frontends / nginx.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  if (!req.path.toLowerCase().startsWith('/uploads')) {
    res.setHeader('X-Frame-Options', 'DENY');
  }

  if (getConfig().isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}
