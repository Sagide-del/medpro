import { api, setToken, clearToken } from './api';

export async function loginRequest(email, password) {
  return api('/auth/login', { method: 'POST', body: { email, password } });
}

export async function registerRequest(payload) {
  return api('/auth/register', { method: 'POST', body: payload });
}

export async function fetchMe() {
  return api('/auth/me');
}

export async function changePasswordRequest(currentPassword, newPassword) {
  return api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword } });
}

export { setToken, clearToken };

/** Home route per role, used after login and for redirect-if-authenticated guards */
export function homeForRole(role) {
  switch (role) {
    case 'super_admin': return '/superadmin';
    case 'institution_admin': return '/admin';
    case 'teacher': return '/teacher';
    case 'student': return '/student';
    default: return '/login';
  }
}
