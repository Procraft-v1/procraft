import { axiosClient } from '@procraft/api';

const endpoint = '/profile/experiences';

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

export const listExperiences = getAll;
export const createExperience = create;
export const updateExperience = update;
export const deleteExperience = remove;
