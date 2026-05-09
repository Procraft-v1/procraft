import { skillCategoriesService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const SKILL_CATEGORIES_QUERY_KEY = ['profile', 'skill-categories'];

export const useSkillCategories = createProfileSectionHook({
  queryKey: SKILL_CATEGORIES_QUERY_KEY,
  dataKey: 'skillCategories',
  service: skillCategoriesService,
});
