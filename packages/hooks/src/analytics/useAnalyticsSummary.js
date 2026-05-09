import { useMutation, useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary, trackProfileView } from '@procraft/services';

export const ANALYTICS_SUMMARY_KEY = ['analytics', 'summary'];

export function useAnalyticsSummary(options) {
  return useQuery({
    queryKey: ANALYTICS_SUMMARY_KEY,
    queryFn: () => getAnalyticsSummary().then((res) => res.data),
    ...options,
  });
}

export function useTrackProfileView(options) {
  return useMutation({
    mutationFn: ({ profileId, referer }) => trackProfileView(profileId, referer),
    retry: false,
    ...options,
  });
}
