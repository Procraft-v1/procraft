import { axiosClient } from '@procraft/api';

export function getAnalyticsSummary(config) {
  return axiosClient.get('/analytics/summary', config);
}
