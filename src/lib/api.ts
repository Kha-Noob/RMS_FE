const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Login expired. Please sign in again.';
    if (error.status === 403) return error.message || 'Permission denied.';
    if (error.status === 400) return error.message || fallback;
    if (error.status >= 500) return error.message ? `Server error: ${error.message}` : 'Server error. Please try again.';
    return error.message || fallback;
  }

  if (error instanceof TypeError) {
    return 'Unable to reach server. Please check your connection.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

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
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type for non-FormData requests
  // For FormData, the browser auto-generates multipart/form-data with boundary
  if (!(fetchOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const creds = getStoredCredentials();
  const isPublic = 
    endpoint.startsWith('/api/public/') || 
    endpoint.startsWith('/api/auth/oauth2/') ||
    endpoint.startsWith('/api/auth/forgot-password/') ||
    endpoint === '/api/auth/login' ||
    endpoint.startsWith('/api/events/public') ||
    endpoint.startsWith('/api/floor-plans/files/');
  if (creds && !isPublic) {
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
    if (res.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const publicExactPaths = ['/', '/login', '/forgot-password', '/oauth2/callback', '/register', '/customer-portal', '/feed', '/events', '/restaurants'];
      const isExactPublic = publicExactPaths.includes(path);
      const isDynamicPublic = path.startsWith('/restaurant-page/');
      if (!isExactPublic && !isDynamicPublic) {
        console.warn("[API] Got 401 Unauthorized, clearing credentials and redirecting to /login");
        clearCredentials();
        localStorage.removeItem('rms_active_branch');
        window.location.href = '/login';
      }
    }

    const contentType = res.headers.get('content-type');
    const text = await res.text().catch(() => '');
    let body: unknown = text;
    let message = text || `HTTP ${res.status}`;

    if (contentType?.includes('application/json') && text) {
      try {
        body = JSON.parse(text);
        if (body && typeof body === 'object') {
          const record = body as Record<string, unknown>;
          const backendMessage = record.message ?? record.error ?? record.detail;
          if (typeof backendMessage === 'string' && backendMessage.trim()) {
            message = backendMessage;
          }
        }
      } catch {
        body = text;
      }
    }

    throw new ApiError(res.status, message, body);
  }

  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>;
  }
  return res.text() as unknown as T;
}

export interface PresignResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
  method: string;
  headers: Record<string, string>;
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

  patch: <T>(endpoint: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PATCH',
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
    if (!file || file.size <= 0) {
      throw new ApiError(400, 'Selected file is empty');
    }

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
