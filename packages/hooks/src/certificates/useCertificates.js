import { certificatesService } from '@procraft/services';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createProfileSectionHook } from '../profile-sections/createProfileSectionHook.js';

export const CERTIFICATES_QUERY_KEY = ['profile', 'certificates'];
export const CERTIFICATES_KEY = CERTIFICATES_QUERY_KEY;

const useCertificateSections = createProfileSectionHook({
  queryKey: CERTIFICATES_QUERY_KEY,
  dataKey: 'certificates',
  service: certificatesService,
});

export function useCertificates(options) {
  const queryClient = useQueryClient();
  const base = useCertificateSections(options);

  const uploadFileMutation = useMutation({
    mutationFn: (file) => certificatesService.uploadFile(file).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_QUERY_KEY });
    },
  });

  return {
    ...base,
    uploadFileMutation,
    uploadFile: (file) => uploadFileMutation.mutateAsync(file),
  };
}
