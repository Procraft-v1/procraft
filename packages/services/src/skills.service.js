import { axiosClient } from '@procraft/api';

const endpoint = '/profile/skills';

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

export const listSkills = getAll;
export const createSkill = create;
export const updateSkill = update;
export const deleteSkill = remove;
