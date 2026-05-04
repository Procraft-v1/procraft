import { useQuery } from '@tanstack/react-query';
import { listCertificates } from '@procraft/services';

export const CERTIFICATES_KEY = ['certificates', 'list'];

export function useCertificates(options) {
  return useQuery({
    queryKey: CERTIFICATES_KEY,
    queryFn: () => listCertificates().then((res) => res.data),
    ...options,
  });
}
