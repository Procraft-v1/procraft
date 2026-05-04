import { axiosClient } from '@procraft/api';

export function register(payload) {
  return axiosClient.post('/auth/register', payload);
}

export function login(payload) {
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
