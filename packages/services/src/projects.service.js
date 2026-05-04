import { axiosClient } from '@procraft/api';

export function listProjects(config) {
  return axiosClient.get('/projects', config);
}
