import { useQuery } from '@tanstack/react-query';
import { getSubscription } from '@procraft/services';

export const SUBSCRIPTION_KEY = ['subscriptions', 'me'];

export function useSubscription(options) {
  return useQuery({
    queryKey: SUBSCRIPTION_KEY,
    queryFn: () => getSubscription().then((res) => res.data),
    ...options,
  });
}
