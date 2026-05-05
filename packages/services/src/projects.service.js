import { axiosClient } from '@procraft/api';

const endpoint = '/profile/projects';

export function getAll(config) {
  return axiosClient.get(endpoint, config);
}

export function create(data) {
  return axiosClient.post(endpoint, data);
}

export function update(id, data) {
  return axiosClient.put(`${endpoint}/${encodeURIComponent(id)}`, data);
}

export function remove(id) {
  return axiosClient.delete(`${endpoint}/${encodeURIComponent(id)}`);
}

export const listProjects = getAll;
export const createProject = create;
export const updateProject = update;
export const deleteProject = remove;
