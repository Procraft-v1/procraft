import { useQuery } from '@tanstack/react-query';
import { getMe } from '@procraft/services';

export const AUTH_ME_KEY = ['auth', 'me'];

export function useMe(options) {
  return useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: () => getMe().then((res) => res.data),
    ...options,
  });
}
