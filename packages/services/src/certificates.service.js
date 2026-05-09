import { axiosClient } from '@procraft/api';

const endpoint = '/profile/certificates';

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

export function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return axiosClient.post(`${endpoint}/file`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export const listCertificates = getAll;
export const createCertificate = create;
export const updateCertificate = update;
export const deleteCertificate = remove;
export const uploadCertificateFile = uploadFile;
