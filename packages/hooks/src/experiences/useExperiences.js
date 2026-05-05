import { experiencesService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const EXPERIENCES_QUERY_KEY = ['profile', 'experiences'];
export const EXPERIENCES_KEY = EXPERIENCES_QUERY_KEY;

export const useExperiences = createProfileSectionHook({
  queryKey: EXPERIENCES_QUERY_KEY,
  dataKey: 'experiences',
  service: experiencesService,
});
