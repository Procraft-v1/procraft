import { axiosClient } from '@procraft/api';
import { getCsrf } from './auth.service.js';

export function getAnalyticsSummary(config) {
  return axiosClient.get('/analytics/summary', config);
}

export async function trackProfileView(profileId, referer) {
  await getCsrf();
  return axiosClient.post('/analytics/track', {
    profileId,
    referer: referer || null,
  }, {
    skipAuthRefresh: true,
    skipAuthRedirect: true,
  });
}
