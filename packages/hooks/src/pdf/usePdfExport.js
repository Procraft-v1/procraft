import { useMutation } from '@tanstack/react-query';
import { requestPdfExport } from '@procraft/services';

export function usePdfExport() {
  return useMutation({
    mutationFn: (payload) => requestPdfExport(payload).then((res) => res.data),
    meta: { domain: 'pdf', action: 'export' },
  });
}
