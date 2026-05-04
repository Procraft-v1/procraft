import { axiosClient } from '@procraft/api';

export function listCertificates(config) {
  return axiosClient.get('/certificates', config);
}
