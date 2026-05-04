import { axiosClient } from '@procraft/api';

export function getTemplates(config) {
  return axiosClient.get('/templates', config);
}

export function listTemplates(config) {
  return getTemplates(config);
}

export function selectTemplate(templateId) {
  return axiosClient.post(`/profile/template/${encodeURIComponent(templateId)}`);
}
