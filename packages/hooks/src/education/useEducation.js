import { useQuery } from '@tanstack/react-query';
import { listEducation } from '@procraft/services';

export const EDUCATION_KEY = ['education', 'list'];

export function useEducation(options) {
  return useQuery({
    queryKey: EDUCATION_KEY,
    queryFn: () => listEducation().then((res) => res.data),
    ...options,
  });
}
