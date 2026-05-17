import axios from 'axios';
import { getApiBaseUrl, SECURITY_DEFAULTS } from '@procraft/config';
import { attachAuthInterceptors } from './auth-interceptor.js';
import { getCsrfTokenFromCookie } from './csrf.js';

/** Shared Axios instance: cookie sessions; no localStorage tokens. */

const axiosClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase();

  const needsCsrf = method === 'post' || method === 'put' || method === 'patch' || method === 'delete';
  const hasJsonBody = needsCsrf && config.data && !(config.data instanceof FormData);

  if (hasJsonBody && !config.headers?.['Content-Type']) {
    config.headers ||= {};
    config.headers['Content-Type'] = 'application/json';
  }

  if (needsCsrf) {
    const token = getCsrfTokenFromCookie();
    config.headers ||= {};
    if (token && !config.headers[SECURITY_DEFAULTS.csrfHeaderName]) {
      config.headers[SECURITY_DEFAULTS.csrfHeaderName] = token;
    }
  }

  return config;
});

attachAuthInterceptors(axiosClient);

export { axiosClient };
