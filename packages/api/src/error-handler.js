/** Normalizes Axios / fetch-style errors into a stable shape for UI. */

export function normalizeApiError(error) {
  if (!error) {
    return { message: 'Unknown error', status: 0, code: 'UNKNOWN' };
  }

  const status = error.response?.status ?? 0;
  const data = error.response?.data;

  let message =
    (typeof data === 'object' && data && typeof data.message === 'string'
      ? data.message
      : undefined) ??
    error.message ??
    `Request failed${status ? ` (${status})` : ''}`;

  const code =
    (typeof data === 'object' && data && typeof data.code === 'string' ? data.code : undefined) ??
    (status ? String(status) : 'NETWORK');

  return { message, status, code, raw: error };
}
