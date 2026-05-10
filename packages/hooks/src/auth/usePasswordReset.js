import { useMutation } from '@tanstack/react-query';
import { forgotPassword, resetPassword } from '@procraft/services';

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload) => forgotPassword(payload).then((res) => res.data),
    meta: { domain: 'auth', action: 'forgotPassword' },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload) => resetPassword(payload).then((res) => res.data),
    meta: { domain: 'auth', action: 'resetPassword' },
  });
}
