import { skillsService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const SKILLS_QUERY_KEY = ['profile', 'skills'];
export const SKILLS_KEY = SKILLS_QUERY_KEY;

export const useSkills = createProfileSectionHook({
  queryKey: SKILLS_QUERY_KEY,
  dataKey: 'skills',
  service: skillsService,
});
