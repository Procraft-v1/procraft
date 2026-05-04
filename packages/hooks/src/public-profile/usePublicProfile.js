import { useQuery } from '@tanstack/react-query';
import { getPublicProfile } from '@procraft/services';

export function publicProfileQueryKey(username) {
  return ['public-profile', username];
}

export function usePublicProfile(username, options) {
  return useQuery({
    queryKey: publicProfileQueryKey(username),
    queryFn: () => getPublicProfile(username).then((res) => res.data),
    enabled: Boolean(username),
    ...options,
  });
}
