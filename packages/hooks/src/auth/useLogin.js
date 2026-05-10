import { useMutation } from '@tanstack/react-query';
import { login, verifyLogin } from '@procraft/services';

export function useLogin() {
  return useMutation({
    mutationFn: (payload) => login(payload).then((res) => res.data),
    meta: {
      domain: 'auth',
      action: 'login',
    },
  });
}

export function useVerifyLogin() {
  return useMutation({
    mutationFn: (payload) => verifyLogin(payload).then((res) => res.data),
    meta: {
      domain: 'auth',
      action: 'verifyLogin',
    },
  });
}
