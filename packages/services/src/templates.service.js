import { axiosClient } from '@procraft/api';

function getCsrf() {
  return axiosClient.get('/auth/csrf', {
    skipAuthRefresh: true,
    skipAuthRedirect: true,
    skipCsrfRetry: true,
  });
}

export function getTemplates(config) {
  return axiosClient.get('/templates', config);
}

export function listTemplates(config) {
  return getTemplates(config);
}

export async function selectTemplate(templateId) {
  await getCsrf();
  return axiosClient.post(`/profile/template/${encodeURIComponent(templateId)}`);
}
