const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getToken() {
  return sessionStorage.getItem('medpro_token');
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const setToken = (t) => sessionStorage.setItem('medpro_token', t);
export const clearToken = () => sessionStorage.removeItem('medpro_token');
