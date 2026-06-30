import { axiosClient } from '@procraft/api';

const endpoint = '/github';

/** Public preview — maps a GitHub username to a ready profile without persisting. */
export function preview(username, config) {
  return axiosClient.get(`${endpoint}/preview/${encodeURIComponent(username)}`, config);
}

/** Persists the mapped GitHub data into the current user's profile. */
export function importProfile(username) {
  return axiosClient.post(`${endpoint}/import`, { username });
}

export const previewGithub = preview;
export const importGithub = importProfile;
