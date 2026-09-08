import { createContext, useContext, useState } from 'react';
import { loginRequest, registerRequest, setToken, clearToken } from '../services/auth';

const AuthContext = createContext(null);

function normalizeProgram(program) {
  return String(program || '').toLowerCase().includes('paramedic') ? 'Paramedic' : 'EMT';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('medpro_user');
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    const selectedProgram = sessionStorage.getItem('medpro_program');
    return { ...parsed, program: selectedProgram || normalizeProgram(parsed.program) };
  });

  async function login(email, password) {
    const data = await loginRequest(email, password);
    setToken(data.token);
    sessionStorage.setItem('medpro_user', JSON.stringify(data.user));
    setUser({ ...data.user, program: normalizeProgram(data.user.program) });
    return data.user;
  }

  async function register(payload) {
    const data = await registerRequest(payload);
    setToken(data.token);
    sessionStorage.setItem('medpro_user', JSON.stringify(data.user));
    setUser({ ...data.user, program: normalizeProgram(data.user.program) });
    return data.user;
  }

  function logout() {
    clearToken();
    sessionStorage.removeItem('medpro_user');
    sessionStorage.removeItem('medpro_program');
    setUser(null);
  }

  function setProgram(program) {
    const nextProgram = normalizeProgram(program);
    setUser((current) => {
      if (!current) return current;
      const nextUser = { ...current, program: nextProgram };
      sessionStorage.setItem('medpro_user', JSON.stringify(nextUser));
      sessionStorage.setItem('medpro_program', nextProgram);
      return nextUser;
    });
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setProgram }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
