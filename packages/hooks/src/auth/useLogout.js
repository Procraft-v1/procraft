import { useMutation } from '@tanstack/react-query';
import { logout } from '@procraft/services';

export function useLogout() {
  return useMutation({
    mutationFn: () => logout().then((res) => res.data),
    meta: { domain: 'auth', action: 'logout' },
  });
}
