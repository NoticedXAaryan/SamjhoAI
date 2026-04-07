// Base URL: in production points to Render backend; in dev proxied by Vite
const BASE = import.meta.env.VITE_API_URL ?? '';

// ── Token storage ─────────────────────────────────────────────────────────────
let refreshPromise: Promise<string> | null = null;

export const auth = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    refreshPromise = null; // Reset so next expiry triggers a new refresh
  },
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: (): User | null => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    refreshPromise = null;
  },
  isLoggedIn: () => !!localStorage.getItem('accessToken'),
};

// ── Fetch wrapper ─────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = auth.getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = auth.getRefreshToken();
    if (refreshToken) {
      // Refresh only once — concurrent 401s all wait on the same promise
      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const refreshRes = await fetch(`${BASE}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });
            if (!refreshRes.ok) throw new Error('Refresh failed');
            const { accessToken } = await refreshRes.json();
            auth.setTokens(accessToken, refreshToken);
            return accessToken;
          })();
        }
        await refreshPromise;
      } catch {
        auth.clear();
        window.location.href = '/auth';
        throw new Error('Session expired');
      }
      // Retry with fresh token
      headers['Authorization'] = `Bearer ${auth.getAccessToken()}`;
      const retry = await fetch(`${BASE}${path}`, { ...options, headers });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    }
    auth.clear();
    window.location.href = '/auth';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? res.statusText);
  }

  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
  avatarId?: number;
}

export interface Meeting {
  id: string;
  title: string;
  status: string;
  scheduledStartAt: string;
  hostId: string;
  host?: { id: string; name: string };
  _count?: { participants: number };
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiFetch<User>('/api/auth/me'),

  logout: async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: 'POST' }).catch(() => {});
    auth.clear();
  },

  // ── Email verification ──
  sendVerification: () =>
    apiFetch<{ success: boolean }>('/api/auth/send-verification', { method: 'POST' }),

  // ── Password reset ──
  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiFetch<{ success: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ success: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // ── Profile ──
  updateProfile: (data: { name?: string; avatarId?: number }) =>
    apiFetch<User>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ── Meetings API ──────────────────────────────────────────────────────────────
export const meetingsApi = {
  create: (data: { title: string; date?: string; time?: string }) =>
    apiFetch<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(data) }),

  list: () => apiFetch<Meeting[]>('/api/meetings'),

  get: (id: string) => apiFetch<Meeting>(`/api/meetings/${id}`),

  participants: (id: string) => apiFetch<Array<{ id: string; role: string; user: { id: string; name: string } }>>(`/api/meetings/${id}/participants`),

  messages: (id: string) => apiFetch<Array<{ id: string; senderId: string; senderName: string; text: string; createdAt: string }>>(`/api/meetings/${id}/messages`),

  cancel: (id: string) => apiFetch<{ success: boolean }>(`/api/meetings/${id}`, { method: 'DELETE' }),
};
