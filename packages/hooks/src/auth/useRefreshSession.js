import { useMutation } from '@tanstack/react-query';
import { refreshSession } from '@procraft/services';

export function useRefreshSession() {
  return useMutation({
    mutationFn: () => refreshSession().then((res) => res.data),
    meta: { domain: 'auth', action: 'refresh' },
  });
}
