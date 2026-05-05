import { socialLinksService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const SOCIAL_LINKS_QUERY_KEY = ['profile', 'social-links'];
export const SOCIAL_LINKS_KEY = SOCIAL_LINKS_QUERY_KEY;

export const useSocialLinks = createProfileSectionHook({
  queryKey: SOCIAL_LINKS_QUERY_KEY,
  dataKey: 'socialLinks',
  service: socialLinksService,
});
