import { axiosClient } from '@procraft/api';

export function requestPdfExport(payload) {
  return axiosClient.post('/pdf/export', payload);
}
