import { useCallback, useEffect, useState } from 'react';
import {
  createProfile,
  deleteAvatar as deleteAvatarRequest,
  getMyProfile,
  updateProfile as updateProfileRequest,
  uploadAvatar as uploadAvatarRequest,
} from '@procraft/services';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMyProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await getMyProfile();
      setProfile(response.data);
      return response.data;
    } catch (error) {
      setProfile(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data) => {
      const request = profile ? updateProfileRequest : createProfile;
      const response = await request(data);
      setProfile(response.data);
      return response.data;
    },
    [profile],
  );

  const uploadAvatar = useCallback(async (file) => {
    const response = await uploadAvatarRequest(file);
    setProfile(response.data);
    return response.data;
  }, []);

  const deleteAvatar = useCallback(async () => {
    const response = await deleteAvatarRequest();
    setProfile(response.data);
    return response.data;
  }, []);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  return {
    profile,
    isLoading,
    fetchMyProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
  };
}
