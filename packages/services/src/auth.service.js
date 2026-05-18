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

export async function verifyRegister(payload) {
  await getCsrf();
  return axiosClient.post('/auth/register/verify', payload);
}

export async function login(payload) {
  await getCsrf();
  return axiosClient.post('/auth/login', payload);
}

export async function verifyLogin(payload) {
  await getCsrf();
  return axiosClient.post('/auth/login/verify', payload);
}

export async function forgotPassword(payload) {
  await getCsrf();
  return axiosClient.post('/auth/password/forgot', payload);
}

export async function resetPassword(payload) {
  await getCsrf();
  return axiosClient.post('/auth/password/reset', payload);
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

export async function updateAccount(payload) {
  await getCsrf();
  return axiosClient.put('/auth/account', payload);
}

export async function deleteAccount() {
  await getCsrf();
  return axiosClient.delete('/auth/account');
}
