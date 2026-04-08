// Force same-origin in production to avoid broken absolute URLs from misconfigured env.
const BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL ?? '');
const REQUEST_TIMEOUT_MS = 12_000;
const NETWORK_RETRIES = 2;
const RETRY_DELAY_MS = 400;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

let refreshPromise: Promise<void> | null = null;

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

export const auth = {
  setUser: (user: User) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: (): User | null => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },
  clear: () => {
    localStorage.removeItem('user');
    refreshPromise = null;
  },
  isLoggedIn: () => !!localStorage.getItem('user'),
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isIdempotentMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function toUserFacingNetworkError(err: unknown): string {
  if (isAbortError(err)) {
    return 'Request timed out. Please retry.';
  }
  if (err instanceof TypeError) {
    return 'Unable to reach server. Please check your connection and try again.';
  }
  return 'Network error. Please try again.';
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const externalSignal = init.signal;
  const onAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onAbort);
    }
  }
}

async function fetchWithRetry(url: string, init: RequestInit, retries: number): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const response = await fetchWithTimeout(url, init);
      if (attempt < retries && RETRYABLE_STATUS.has(response.status)) {
        attempt++;
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < retries && (isAbortError(err) || err instanceof TypeError)) {
        attempt++;
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err;
    }
  }
}

async function parseApiError(res: Response): Promise<string> {
  const body = await res.json().catch(() => null) as { error?: string; message?: string } | null;
  if (body?.error) return body.error;
  if (body?.message) return body.message;
  if (res.status === 401) return 'Authentication required. Please sign in again.';
  if (res.status === 403) return 'You do not have permission to perform this action.';
  if (res.status === 404) return 'Requested resource was not found.';
  if (res.status >= 500) return 'Server is temporarily unavailable. Please try again.';
  return res.statusText || `Request failed (${res.status})`;
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  return text ? JSON.parse(text) as T : ({} as T);
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetchWithRetry(
      `${BASE}${path}`,
      { ...options, headers, credentials: 'include' },
      isIdempotentMethod(method) ? NETWORK_RETRIES : 0,
    );
  } catch (err) {
    throw new Error(toUserFacingNetworkError(err));
  }

  if (res.status === 401) {
    try {
      if (!refreshPromise) {
        refreshPromise = fetchWithTimeout(`${BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }).then(async (refreshRes) => {
          if (!refreshRes.ok) throw new Error('Refresh failed');
        });
      }
      await refreshPromise;
    } catch {
      auth.clear();
      window.location.href = '/auth';
      throw new Error('Session expired');
    } finally {
      refreshPromise = null;
    }

    let retryRes: Response;
    try {
      retryRes = await fetchWithTimeout(`${BASE}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (err) {
      throw new Error(toUserFacingNetworkError(err));
    }

    if (!retryRes.ok) throw new Error(await parseApiError(retryRes));
    return parseResponse<T>(retryRes);
  }

  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }

  return parseResponse<T>(res);
}

export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string }) =>
    apiFetch<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => apiFetch<User>('/api/auth/me'),

  logout: async () => {
    await fetch(`${BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    auth.clear();
  },

  sendVerification: () =>
    apiFetch<{ success: boolean }>('/api/auth/send-verification', { method: 'POST' }),

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

  updateProfile: (data: { name?: string; avatarId?: number }) =>
    apiFetch<User>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const meetingsApi = {
  create: (data: { title: string; date?: string; time?: string }) =>
    apiFetch<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(data) }),

  list: () => apiFetch<Meeting[]>('/api/meetings'),

  get: (id: string) => apiFetch<Meeting>(`/api/meetings/${id}`),

  participants: (id: string) =>
    apiFetch<Array<{ id: string; role: string; user: { id: string; name: string } }>>(
      `/api/meetings/${id}/participants`,
    ),

  messages: (id: string) =>
    apiFetch<Array<{ id: string; senderId: string; senderName: string; text: string; createdAt: string }>>(
      `/api/meetings/${id}/messages`,
    ),

  cancel: (id: string) => apiFetch<{ success: boolean }>(`/api/meetings/${id}`, { method: 'DELETE' }),
};
