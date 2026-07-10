const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getStoredCredentials(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('rms_auth_credentials');
  return raw || null;
}

function getActiveBranchId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rms_active_branch') || null;
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
    ...(fetchOptions.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  const creds = getStoredCredentials();
  if (creds) {
    headers['Authorization'] = `Basic ${creds}`;
  }

  const branchId = getActiveBranchId();
  if (branchId) {
    headers['X-Branch-Id'] = branchId;
  }

  console.log("[API FETCH] URL:", url, "Body constructor:", fetchOptions.body ? fetchOptions.body.constructor.name : 'none');
  console.log("[API FETCH] Headers:", headers);

  const res = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Request failed');
    let errorMessage = text || `HTTP ${res.status}`;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) {
        errorMessage = parsed.message;
      } else if (parsed.error) {
        errorMessage = parsed.error;
      }
    } catch {
      // Response is not JSON or parsing failed, fallback to raw text/status
    }
    throw new Error(errorMessage);
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

  uploadFile: <T>(endpoint: string, file: File, extraParams?: Record<string, string>) => {
    const formData = new FormData();
    formData.append('file', file);
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },
  postMultipart: <T>(endpoint: string, formData: FormData, opts?: RequestOptions) => {
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: {},
      ...opts,
    });
  },
};

export function connectWebSocket(path: string): WebSocket {
  const wsBase = API_BASE.replace(/^http/, 'ws');
  return new WebSocket(`${wsBase}${path}`);
}
