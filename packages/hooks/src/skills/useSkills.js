import { useQuery } from '@tanstack/react-query';
import { listSkills } from '@procraft/services';

export const SKILLS_KEY = ['skills', 'list'];

export function useSkills(options) {
  return useQuery({
    queryKey: SKILLS_KEY,
    queryFn: () => listSkills().then((res) => res.data),
    ...options,
  });
}
