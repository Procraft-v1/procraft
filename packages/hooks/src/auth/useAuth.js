import { useCallback, useEffect, useState } from 'react';
import { getMe, login as loginRequest, logout as logoutRequest, register as registerRequest } from '@procraft/services';

function readUser(response) {
  return response?.data?.user ?? response?.user ?? null;
}

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetchMe = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMe({ skipAuthRedirect: true });
      const nextUser = readUser(response);
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchMe();
  }, [refetchMe]);

  const login = useCallback(async (data) => {
    const response = await loginRequest(data);
    const nextUser = readUser(response);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (data) => {
    const response = await registerRequest(data);
    const nextUser = readUser(response);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    refetchMe,
  };
}
