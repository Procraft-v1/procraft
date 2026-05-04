import { useMutation } from '@tanstack/react-query';
import { login } from '@procraft/services';

export function useLogin() {
  return useMutation({
    mutationFn: (payload) => login(payload).then((res) => res.data),
    meta: {
      domain: 'auth',
      action: 'login',
    },
  });
}
