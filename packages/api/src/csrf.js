import { SECURITY_DEFAULTS } from '@procraft/config';

/**
 * Reads CSRF token from a readable cookie (same-site scripts), if backend uses dual-cookie /
 * readable anti-forgery token strategy. Backend may instead use antiforgery tokens only on
 * the server side — callers must remain compatible with finalized `AUTH_STRATEGY`.
 */
export function getCsrfTokenFromCookie(cookieName = SECURITY_DEFAULTS.csrfCookieName) {
  if (typeof document === 'undefined') return '';

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${encodeURIComponent(cookieName)}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : '';
}
