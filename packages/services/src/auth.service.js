import { axiosClient } from '@procraft/api';

export function getCsrf() {
  return axiosClient.get('/auth/csrf', {
    skipAuthRefresh: true,
    skipAuthRedirect: true,
  });
}

export async function register(payload) {
  await getCsrf();
  return axiosClient.post('/auth/register', payload);
}

export async function login(payload) {
  await getCsrf();
  return axiosClient.post('/auth/login', payload);
}

export function getMe(config) {
  return axiosClient.get('/auth/me', config);
}

export function refreshSession() {
  return axiosClient.post('/auth/refresh');
}

export function logout() {
  return axiosClient.post('/auth/logout');
}
