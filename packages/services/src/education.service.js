import { axiosClient } from '@procraft/api';

export function listEducation(config) {
  return axiosClient.get('/education', config);
}
