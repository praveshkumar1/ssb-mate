// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// API Client class
class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }
  
  // Generic fetch wrapper
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
  // Get auth token if available
  const token = localStorage.getItem('token');

  // Ensure cookies are sent so server can read session cookie and csrf cookie
  const defaultCredentials = 'include' as RequestCredentials;
    
    // Build headers carefully so options.headers can't accidentally remove Authorization
    // If the body is FormData, let the browser set the Content-Type (with boundary) and don't set it here.
    const defaultHeaders: Record<string, string> = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    // For unsafe methods, include CSRF header using double-submit cookie pattern
    const unsafeMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    const method = (options.method || 'GET').toUpperCase();
    if (unsafeMethods.includes(method)) {
      // Try to read the CSRF cookie (default name 'ssb_csrf' or override via env)
      const csrfCookieName = (import.meta.env.VITE_CSRF_COOKIE_NAME as string) || 'ssb_csrf';
      const cookieValue = document.cookie.split(';').map(s => s.trim()).find(c => c.startsWith(`${csrfCookieName}=`));
      const csrfToken = cookieValue ? cookieValue.split('=')[1] : null;
      if (csrfToken) {
        defaultHeaders[(import.meta.env.VITE_CSRF_HEADER_NAME as string) || 'x-csrf-token'] = decodeURIComponent(csrfToken);
      }
    }

    // Normalize incoming headers (could be Headers, object, or undefined)
    const incomingHeaders: Record<string, string> = {};
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => { incomingHeaders[key] = value; });
    } else if (options.headers && typeof options.headers === 'object') {
      Object.assign(incomingHeaders, options.headers as Record<string, string>);
    }

    // Merge but ensure Authorization from token wins unless incoming explicitly sets it
    const mergedHeaders = { ...defaultHeaders, ...incomingHeaders };

    const config: RequestInit = {
      ...options,
      headers: mergedHeaders,
      // ensure cookies (session + csrf) are sent with requests
      credentials: (options.credentials as RequestCredentials) || defaultCredentials,
    };

    // (debug logs removed)

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Global UX for auth failures / CSRF errors
        if (
          response.status === 401 ||
          (response.status === 403 && data && (data.error === 'Invalid CSRF token' || data.message === 'Invalid CSRF token'))
        ) {
          try {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.setItem('auth:reason', response.status === 401 ? 'session_expired' : 'session_expired_csrf');
          } catch {}
          try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { toast } = require('@/hooks/use-toast');
            if (toast) {
              toast({ title: 'Session expired', description: 'Please sign in again' });
            }
          } catch {}
          // redirect after a short tick so toast can render
          setTimeout(() => { window.location.href = '/login'; }, 50);
        }

        const err: any = new Error(data?.error || data?.message || `HTTP error! status: ${response.status}`);
        err.status = response.status;
        err.data = data;
        throw err;
      }

      // Return the data from the response for successful requests
      return data?.data !== undefined ? data.data : data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

export default apiClient;
