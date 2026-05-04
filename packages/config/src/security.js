/** Non-secret identifiers for cookie/header wiring — must match backend gateway and `AUTH_STRATEGY.md`. */

export const SECURITY_DEFAULTS = Object.freeze({
  csrfCookieName: 'procraft_csrf',
  csrfHeaderName: 'X-CSRF-TOKEN',
});
