import {expireSession,tokenExpired} from '../utils/sessionLifecycle';
import { restoreSessionUser } from '../utils/sessionUser';
import { normalizeProgram } from '../data/programs';
import { createContext, useContext, useEffect, useState } from 'react';
import { loginRequest, registerRequest, setToken, clearToken } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    sessionStorage.removeItem('medpro_program');
    const token=sessionStorage.getItem('medpro_token');
    if(!token)return null;
    if(tokenExpired(token)){expireSession(token);return null;}
    const restored=restoreSessionUser(sessionStorage.getItem('medpro_user'),sessionStorage.getItem('medpro_token') || '');
    if(restored)sessionStorage.setItem('medpro_user',JSON.stringify(restored));
    return restored;
  });

  useEffect(()=>{const expired=()=>setUser(null);window.addEventListener('medpro:session-expired',expired);return()=>window.removeEventListener('medpro:session-expired',expired);},[]);

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


  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
