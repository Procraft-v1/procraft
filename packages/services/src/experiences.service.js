import { axiosClient } from '@procraft/api';

export function listExperiences(config) {
  return axiosClient.get('/experiences', config);
}
