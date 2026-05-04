import { useMutation } from '@tanstack/react-query';
import { register } from '@procraft/services';

export function useRegister() {
  return useMutation({
    mutationFn: (payload) => register(payload).then((res) => res.data),
    meta: { domain: 'auth', action: 'register' },
  });
}
