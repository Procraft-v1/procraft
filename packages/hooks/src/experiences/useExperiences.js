import { useQuery } from '@tanstack/react-query';
import { listExperiences } from '@procraft/services';

export const EXPERIENCES_KEY = ['experiences', 'list'];

export function useExperiences(options) {
  return useQuery({
    queryKey: EXPERIENCES_KEY,
    queryFn: () => listExperiences().then((res) => res.data),
    ...options,
  });
}
