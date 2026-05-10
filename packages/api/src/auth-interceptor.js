/**
 * Registers response handling for authenticated cookie sessions.
 */
export function attachAuthInterceptors(client) {
  let refreshRequest = null;

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

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

function isAuthMutation(url) {
  return ['/auth/login', '/auth/register', '/auth/logout', '/auth/refresh'].some((path) => url.includes(path));
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
