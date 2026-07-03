import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const WATER_HAZARDS_URL = process.env.NEXT_PUBLIC_WATER_HAZARDS_URL || 'http://127.0.0.1:8003';

// Calls to server/ (the Node API) require the signed-in official/analyst's JWT.
async function authedRequest(endpoint, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || `Request failed: ${response.status}`);
  }
  return body;
}

// webscraping.py's read endpoints are public - no auth needed.
async function publicRequest(baseUrl, endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.detail || `Request failed: ${response.status}`);
  }
  return body;
}

export const dashboardApi = {
  getMe: () => authedRequest('/users/me'),
  getReports: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return authedRequest(`/reports${query ? `?${query}` : ''}`);
  },
  getReportsHeatmap: () => authedRequest('/reports/heatmap'),
  getReportsByGeohash: (precision = 4) => authedRequest(`/reports/geohash?precision=${precision}`),
  verifyReport: (reportId, status) =>
    authedRequest(`/reports/${reportId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getUsers: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return authedRequest(`/users${query ? `?${query}` : ''}`);
  },
  getRecentHazardEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return publicRequest(WATER_HAZARDS_URL, `/events/recent${query ? `?${query}` : ''}`);
  },
  registerUser: (name, email, role) =>
    authedRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, role }),
    }),
};
