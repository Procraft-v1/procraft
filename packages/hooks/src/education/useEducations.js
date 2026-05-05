import { educationService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const EDUCATIONS_QUERY_KEY = ['profile', 'educations'];
export const EDUCATIONS_KEY = EDUCATIONS_QUERY_KEY;

export const useEducations = createProfileSectionHook({
  queryKey: EDUCATIONS_QUERY_KEY,
  dataKey: 'educations',
  service: educationService,
});
