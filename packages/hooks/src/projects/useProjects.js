import { projectsService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const PROJECTS_QUERY_KEY = ['profile', 'projects'];
export const PROJECTS_KEY = PROJECTS_QUERY_KEY;

export const useProjects = createProfileSectionHook({
  queryKey: PROJECTS_QUERY_KEY,
  dataKey: 'projects',
  service: projectsService,
});
