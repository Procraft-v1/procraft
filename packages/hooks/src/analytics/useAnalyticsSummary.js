import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from '@procraft/services';

export const ANALYTICS_SUMMARY_KEY = ['analytics', 'summary'];

export function useAnalyticsSummary(options) {
  return useQuery({
    queryKey: ANALYTICS_SUMMARY_KEY,
    queryFn: () => getAnalyticsSummary().then((res) => res.data),
    ...options,
  });
}
