import { useQuery } from '@tanstack/react-query';
import { listProjects } from '@procraft/services';

export const PROJECTS_KEY = ['projects', 'list'];

export function useProjects(options) {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => listProjects().then((res) => res.data),
    ...options,
  });
}
