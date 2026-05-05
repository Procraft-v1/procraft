import { axiosClient } from '@procraft/api';

export function downloadResume(config) {
  return axiosClient.get('/pdf/download', {
    ...config,
    responseType: 'blob',
  });
}

export const requestPdfExport = downloadResume;
