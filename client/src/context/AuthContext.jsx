import { createContext, useContext, useState } from 'react';
import { loginRequest, registerRequest, setToken, clearToken } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('medpro_user');
    return saved ? JSON.parse(saved) : null;
  });

  async function login(email, password) {
    const data = await loginRequest(email, password);
    setToken(data.token);
    sessionStorage.setItem('medpro_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await registerRequest(payload);
    setToken(data.token);
    sessionStorage.setItem('medpro_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    sessionStorage.removeItem('medpro_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
