import { useCallback, useEffect, useState } from 'react';
import { createProfile, getMyProfile, updateProfile as updateProfileRequest } from '@procraft/services';

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

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  return {
    profile,
    isLoading,
    fetchMyProfile,
    updateProfile,
  };
}
