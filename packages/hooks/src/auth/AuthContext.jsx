import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  deleteAccount as deleteAccountRequest,
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  updateAccount as updateAccountRequest,
  verifyRegister as verifyRegisterRequest,
  verifyLogin as verifyLoginRequest,
} from "@procraft/services";

const AuthContext = createContext(null);
const AUTH_SESSION_HINT_KEY = "procraft.authSessionHint";

function hasSessionHint() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1" ||
    window.sessionStorage.getItem(AUTH_SESSION_HINT_KEY) === "1"
  );
}

function setSessionHint() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
  window.sessionStorage.removeItem(AUTH_SESSION_HINT_KEY);
}

function clearSessionHint() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_HINT_KEY);
}

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
    const shouldCheckSession = hasSessionHint();

    if (isAuthPage || !shouldCheckSession) {
      setIsLoading(false);
      return;
    }

    getMe({ skipAuthRedirect: true })
      .then((res) => setUser(readUser(res)))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const refetchMe = useCallback(async () => {
    try {
      const res = await getMe({ skipAuthRedirect: true });
      const nextUser = readUser(res);
      setUser(nextUser);
      if (nextUser) {
        setSessionHint();
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
    if (nextUser) {
      setSessionHint();
    }
    return nextUser;
  }, []);

  const verifyLogin = useCallback(async (data) => {
    const res = await verifyLoginRequest(data);
    const nextUser = readUser(res);
    setUser(nextUser);
    if (nextUser) {
      setSessionHint();
    }
    return nextUser;
  }, []);

  const register = useCallback(async (data) => {
    const res = await registerRequest(data);
    return res?.data ?? res;
  }, []);

  const verifyRegister = useCallback(async (data) => {
    const res = await verifyRegisterRequest(data);
    const nextUser = readUser(res);
    setUser(nextUser);
    if (nextUser) {
      setSessionHint();
    }
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
      clearSessionHint();
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      await deleteAccountRequest();
    } finally {
      setUser(null);
      clearSessionHint();
    }
  }, []);

  const updateAccount = useCallback(async (data) => {
    const res = await updateAccountRequest(data);
    const nextUser = readUser(res);
    setUser(nextUser);
    if (nextUser) {
      setSessionHint();
    }
    return nextUser;
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
        verifyRegister,
        logout,
        deleteAccount,
        updateAccount,
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
