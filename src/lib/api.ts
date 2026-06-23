const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getStoredCredentials(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('rms_auth_credentials');
  return raw || null;
}

export function storeCredentials(email: string, password: string) {
  const encoded = btoa(`${email}:${password}`);
  localStorage.setItem('rms_auth_credentials', encoded);
}

export function clearCredentials() {
  localStorage.removeItem('rms_auth_credentials');
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  const creds = getStoredCredentials();
  if (creds) {
    headers['Authorization'] = `Basic ${creds}`;
  }

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Request failed');
    throw new Error(text || `HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

export const api = {
  get: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...opts }),

  post: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  postForm: <T>(endpoint: string, params: Record<string, string | number | undefined>, opts?: RequestOptions) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return request<T>(endpoint, {
      method: 'POST',
      body: searchParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      ...opts,
    });
  },

  put: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),

  delete: <T>(endpoint: string, opts?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...opts }),

  deleteForm: <T>(endpoint: string, params: Record<string, string | number | undefined>, opts?: RequestOptions) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    return request<T>(endpoint, {
      method: 'DELETE',
      body: searchParams,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      ...opts,
    });
  },
};

export function connectWebSocket(path: string): WebSocket {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}${path}`);
}
