import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  verifyLogin as verifyLoginRequest,
} from "@procraft/services";

const AuthContext = createContext(null);
const AUTH_SESSION_HINT_KEY = "procraft.authSessionHint";

function readUser(response) {
  const payload = response?.data ?? response;
  return (
    payload?.user ??
    payload?.User ??
    payload?.data?.user ??
    payload?.Data?.User ??
    payload?.result?.user ??
    payload?.Result?.User ??
    null
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    const isAuthPage = path === "/login" || path === "/register" || path === "/reset-password";
    const shouldCheckSession =
      typeof window !== "undefined" &&
      window.sessionStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";

    if (isAuthPage || !shouldCheckSession) {
      setIsLoading(false);
      return;
    }

    getMe({ skipAuthRedirect: true, skipAuthRefresh: true })
      .then((res) => setUser(readUser(res)))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const refetchMe = useCallback(async () => {
    try {
      const res = await getMe({ skipAuthRedirect: true, skipAuthRefresh: true });
      const nextUser = readUser(res);
      setUser(nextUser);
      if (nextUser && typeof window !== "undefined") {
        window.sessionStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
      }
      return nextUser;
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  const login = useCallback(async (data) => {
    const res = await loginRequest(data);
    const nextUser = readUser(res);
    setUser(nextUser);
    if (nextUser && typeof window !== "undefined") {
      window.sessionStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
    }
    return nextUser;
  }, []);

  const verifyLogin = useCallback(async (data) => {
    const res = await verifyLoginRequest(data);
    const nextUser = readUser(res);
    setUser(nextUser);
    if (nextUser && typeof window !== "undefined") {
      window.sessionStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
    }
    return nextUser;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerRequest(data);
    const nextUser = readUser(res);
    setUser(nextUser);
    if (nextUser && typeof window !== "undefined") {
      window.sessionStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
    }
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(AUTH_SESSION_HINT_KEY);
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        verifyLogin,
        register,
        logout,
        refetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
