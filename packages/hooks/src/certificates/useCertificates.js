import { certificatesService } from '@procraft/services';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const CERTIFICATES_QUERY_KEY = ['profile', 'certificates'];
export const CERTIFICATES_KEY = CERTIFICATES_QUERY_KEY;

export const useCertificates = createProfileSectionHook({
  queryKey: CERTIFICATES_QUERY_KEY,
  dataKey: 'certificates',
  service: certificatesService,
});
