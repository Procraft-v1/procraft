import { customSectionsService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const CUSTOM_SECTIONS_QUERY_KEY = ['profile', 'custom-sections'];
export const CUSTOM_SECTIONS_KEY = CUSTOM_SECTIONS_QUERY_KEY;

export const useCustomSections = createProfileSectionHook({
  queryKey: CUSTOM_SECTIONS_QUERY_KEY,
  dataKey: 'customSections',
  service: customSectionsService,
});
