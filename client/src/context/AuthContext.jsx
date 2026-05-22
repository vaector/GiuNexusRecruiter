<<<<<<< HEAD
import { createContext, useState, useContext, useEffect } from "react";
=======
import { createContext, useState, useContext, useCallback } from "react";
import { authAPI } from "../services/api";
>>>>>>> origin/main

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      if (localStorage.getItem("token")) {
        await authAPI.logout();
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearSession();
    }
  };

  const updateUser = useCallback((nextUser) => {
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    else localStorage.removeItem("user");
    setUser(nextUser);
  }, []);

  useEffect(() => {
    const onApiLogout = () => logout();
    window.addEventListener("auth:logout", onApiLogout);
    return () => window.removeEventListener("auth:logout", onApiLogout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, setUser, isAuthenticated: Boolean(token) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
