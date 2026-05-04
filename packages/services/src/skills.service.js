import { axiosClient } from '@procraft/api';

export function listSkills(config) {
  return axiosClient.get('/skills', config);
}
