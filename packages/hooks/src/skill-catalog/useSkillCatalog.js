import { useQuery } from '@tanstack/react-query';
import { getSkillCatalog } from '@procraft/services';

export const SKILL_CATALOG_QUERY_KEY = ['skill-catalog'];

const EMPTY_CATALOG = { skills: [], categories: [] };

/**
 * Global suggestion catalog shared across all profiles. Cached longer than
 * per-user data — it changes slowly and is non-sensitive.
 */
export function useSkillCatalog(options) {
  const query = useQuery({
    queryKey: SKILL_CATALOG_QUERY_KEY,
    queryFn: () => getSkillCatalog().then((res) => res.data ?? EMPTY_CATALOG),
    staleTime: 5 * 60_000,
    ...options,
  });

  const data = query.data ?? EMPTY_CATALOG;

  return {
    ...query,
    catalogSkills: data.skills ?? [],
    catalogCategories: data.categories ?? [],
  };
}
