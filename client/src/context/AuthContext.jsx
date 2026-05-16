// Global authentication state
// Exposes: user, token, login(), logout(), isAuthenticated
// Wraps entire app so all components can access auth state
import { createContext, useState, useEffect, useCallback } from "react";
import { getToken, setToken, removeToken } from "../utils/token";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(getToken());
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(token);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = useCallback(() => {
    removeToken();
    setTokenState(null);
    setUser(null);
    localStorage.removeItem("user");
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "token" && !e.newValue) logout();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;