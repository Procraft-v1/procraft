import { axiosClient } from '@procraft/api';

const endpoint = '/profile/educations';

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

export const listEducations = getAll;
export const listEducation = getAll;
export const createEducation = create;
export const updateEducation = update;
export const deleteEducation = remove;
