import { axiosClient } from '@procraft/api';

export function getSubscription(config) {
  return axiosClient.get('/subscriptions/me', config);
}
