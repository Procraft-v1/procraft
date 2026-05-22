/**
 * Registers response handling for authenticated cookie sessions.
 */
import { SECURITY_DEFAULTS } from '@procraft/config';

export function attachAuthInterceptors(client) {
  let refreshRequest = null;
  let csrfRequest = null;

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      if (
        originalRequest &&
        status === 403 &&
        !originalRequest._csrfRetry &&
        !originalRequest.skipCsrfRetry &&
        requiresCsrf(originalRequest) &&
        isCsrfError(error)
      ) {
        originalRequest._csrfRetry = true;

        try {
          csrfRequest ??= client.get('/auth/csrf', {
            skipAuthRefresh: true,
            skipAuthRedirect: true,
            skipCsrfRetry: true,
          });
          await csrfRequest;
          removeCsrfHeader(originalRequest);
          return client.request(originalRequest);
        } finally {
          csrfRequest = null;
        }
      }

      if (!originalRequest || status !== 401 || originalRequest._retry || originalRequest.skipAuthRefresh) {
        return Promise.reject(error);
      }

      const url = originalRequest.url ?? '';
      if (isAuthMutation(url)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        refreshRequest ??= client
          .get('/auth/csrf', { skipAuthRefresh: true, skipAuthRedirect: true })
          .then(() => client.post('/auth/refresh', undefined, { skipAuthRefresh: true }));
        await refreshRequest;
        return client.request(originalRequest);
      } catch (refreshError) {
        if (!originalRequest.skipAuthRedirect) {
          redirectToLogin();
        }
        return Promise.reject(refreshError);
      } finally {
        refreshRequest = null;
      }
    },
  );
}

function requiresCsrf(request) {
  const method = request.method?.toLowerCase();
  return method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
}

function isCsrfError(error) {
  const payload = error.response?.data;
  const title = String(payload?.title || payload?.Title || payload?.message || payload?.Message || '').toLowerCase();
  return title.includes('csrf');
}

function removeCsrfHeader(request) {
  if (!request.headers) {
    return;
  }

  if (typeof request.headers.delete === 'function') {
    request.headers.delete(SECURITY_DEFAULTS.csrfHeaderName);
    return;
  }

  delete request.headers[SECURITY_DEFAULTS.csrfHeaderName];
  delete request.headers[SECURITY_DEFAULTS.csrfHeaderName.toLowerCase()];
}

function isAuthMutation(url) {
  return [
    '/auth/login',
    '/auth/login/verify',
    '/auth/register',
    '/auth/register/verify',
    '/auth/logout',
    '/auth/refresh',
    '/auth/password/forgot',
    '/auth/password/reset',
  ].some((path) => url.includes(path));
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }

  const current = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname === '/login') {
    return;
  }

  window.dispatchEvent(new CustomEvent('procraft:auth-required', {
    detail: { returnTo: current },
  }));
}
