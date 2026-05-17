import { useMutation } from '@tanstack/react-query';
import { register, verifyRegister } from '@procraft/services';

export function useRegister() {
  return useMutation({
    mutationFn: (payload) => register(payload).then((res) => res.data),
    meta: { domain: 'auth', action: 'register' },
  });
}

export function useVerifyRegister() {
  return useMutation({
    mutationFn: (payload) => verifyRegister(payload).then((res) => res.data),
    meta: { domain: 'auth', action: 'verifyRegister' },
  });
}
