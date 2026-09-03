// Centralized API Client for SentinelRisk AI
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // If running on Vite dev server port 5173, point to backend port 8000 if needed, or relative if proxied
    if (window.location.port === '5173') {
      return 'http://localhost:8000/api';
    }
  }
  return '/api';
};

export const API_BASE = getApiBase();

export async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`API Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}
