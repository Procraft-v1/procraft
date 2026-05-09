import { axiosClient } from '@procraft/api';

const endpoint = '/profile/skill-categories';

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

export const listSkillCategories = getAll;
export const createSkillCategory = create;
export const updateSkillCategory = update;
export const deleteSkillCategory = remove;
