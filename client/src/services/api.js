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
  if (!res.ok) {
    const retryAfterSeconds=Number(data.retryAfterSeconds || res.headers.get('Retry-After')) || null;
    const error = new Error(data.error || (res.status===429?`Too many requests. ${retryAfterSeconds?`Try again in ${retryAfterSeconds} seconds.`:'Please wait a moment and try again.'}`:`Request failed (${res.status})`));
    error.retryAfterSeconds=retryAfterSeconds;
    error.status = res.status;
    error.code = data.code;
    error.subscription = data.subscription;
    error.feature = data.feature;
    error.details = data;
    throw error;
  }
  if (method !== 'GET' && /(?:\/submit|\/responses|\/planner\/(?:generate|update)|\/payments\/(?:purchase|subscribe))$/.test(path)) window.dispatchEvent(new Event('medpro:notifications-refresh'));
  return data;
}

export const setToken = (t) => sessionStorage.setItem('medpro_token', t);
export const clearToken = () => sessionStorage.removeItem('medpro_token');

export function mediaUrl(value) {
  if (typeof value !== 'string') return '';
  if (/^https:\/\//i.test(value)) return value;
  if (!value.startsWith('/uploads/')) return '';
  const backend = new URL(BASE, window.location.origin);
  return new URL(value, backend.origin).href;
}
