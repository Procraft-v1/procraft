import { axiosClient } from '@procraft/api';

const endpoint = '/github';

/** Public preview — maps a GitHub username to a ready profile without persisting. */
export function preview(username, config) {
  return axiosClient.get(`${endpoint}/preview/${encodeURIComponent(username)}`, config);
}

/** Persists the mapped GitHub data into the current user's profile. */
export function importProfile(
  username,
  { profile, selectedRepoNames, selectedSkillNames, selectedSocialPlatforms } = {},
) {
  return axiosClient.post(`${endpoint}/import`, {
    username,
    profile,
    selectedRepoNames,
    selectedSkillNames,
    selectedSocialPlatforms,
  });
}

export const previewGithub = preview;
export const importGithub = importProfile;
