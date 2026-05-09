import { axiosClient } from '@procraft/api';

export function getMyProfile(config) {
  return axiosClient.get('/profile/me', config);
}

export function createProfile(payload) {
  return axiosClient.post('/profile', payload);
}

export function updateProfile(payload) {
  return axiosClient.put('/profile', payload);
}

export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  return axiosClient.post('/profile/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function deleteAvatar() {
  return axiosClient.delete('/profile/avatar');
}

export function getPublicProfile(username, config) {
  return axiosClient.get(`/profile/${encodeURIComponent(username)}`, config);
}

export function getProfile(config) {
  return getMyProfile(config);
}
