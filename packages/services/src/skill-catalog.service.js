import { axiosClient } from '@procraft/api';

const endpoint = '/skill-catalog';

/** Global, cross-profile suggestion catalog: { skills: string[], categories: string[] }. */
export function getSkillCatalog(config) {
  return axiosClient.get(endpoint, config);
}
