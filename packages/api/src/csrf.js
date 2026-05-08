import { SECURITY_DEFAULTS } from "@procraft/config";

export function getCsrfTokenFromCookie(
  cookieName = SECURITY_DEFAULTS.csrfCookieName,
) {
  if (typeof document === "undefined") return "";

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${encodeURIComponent(cookieName)}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : "";
}
