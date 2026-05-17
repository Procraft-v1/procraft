import { axiosClient } from '@procraft/api';

const endpoint = '/profile/certificates';

function hasFile(data) {
  return typeof File !== 'undefined' && data?.file instanceof File;
}

function toFormData(data) {
  const formData = new FormData();
  Object.entries(data ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    formData.append(key, value);
  });
  return formData;
}

function multipartConfig() {
  return {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
}

export function getAll(config) {
  return axiosClient.get(endpoint, config);
}

export function create(data) {
  if (hasFile(data)) {
    return axiosClient.post(endpoint, toFormData(data), multipartConfig());
  }

  return axiosClient.post(endpoint, data);
}

export function update(id, data) {
  if (hasFile(data)) {
    return axiosClient.put(`${endpoint}/${encodeURIComponent(id)}`, toFormData(data), multipartConfig());
  }

  return axiosClient.put(`${endpoint}/${encodeURIComponent(id)}`, data);
}

export function remove(id) {
  return axiosClient.delete(`${endpoint}/${encodeURIComponent(id)}`);
}

export function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  return axiosClient.post(`${endpoint}/file`, formData, multipartConfig());
}

export const listCertificates = getAll;
export const createCertificate = create;
export const updateCertificate = update;
export const deleteCertificate = remove;
export const uploadCertificateFile = uploadFile;
