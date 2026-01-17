import type { ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestConfig {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  authToken?: string; // Override token for immediate use after login
}

interface TokenStore {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  setTokens: (access: string, refresh: string, expiresIn?: number) => void;
  clearTokens: () => void;
  isDeviceSession?: () => boolean;  // For device token refresh
  isTokenExpiringSoon?: (thresholdMs?: number) => boolean;  // For proactive refresh
}

// Token store will be injected from session store
let tokenStore: TokenStore | null = null;

export function setTokenStore(store: TokenStore) {
  tokenStore = store;
}

/**
 * API Client with automatic token refresh and error handling
 */
class ApiClient {
  private baseUrl: string;
  private tenantId: string | null = null;
  private employeeId: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  setEmployeeId(employeeId: string | null) {
    this.employeeId = employeeId;
  }

  private async refreshTokens(): Promise<boolean> {
    if (!tokenStore) return false;

    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) return false;

    // Use device refresh endpoint for device sessions
    const isDevice = tokenStore.isDeviceSession?.() ?? false;
    const refreshEndpoint = isDevice ? '/auth/device/refresh' : '/auth/refresh';

    try {
      const response = await fetch(`${this.baseUrl}${refreshEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Only clear tokens on authentication errors (401/403)
        // For other errors (500, network issues), keep tokens to allow retry
        if (response.status === 401 || response.status === 403) {
          console.warn('[ApiClient] Refresh token invalid, clearing session');
          tokenStore.clearTokens();
        } else {
          console.warn('[ApiClient] Refresh failed with status:', response.status);
        }
        return false;
      }

      const data = await response.json();
      tokenStore.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
      console.log('[ApiClient] Token refresh successful, expires in:', data.expiresIn);
      return true;
    } catch (error) {
      // Network errors should NOT clear tokens - it might be a transient issue
      console.warn('[ApiClient] Token refresh network error:', error);
      return false;
    }
  }

  private async handleTokenRefresh(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.refreshTokens();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false, authToken } = config;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Add tenant ID header
    if (this.tenantId) {
      requestHeaders['X-Tenant-ID'] = this.tenantId;
    }

    // Add employee ID header (for KIOSK mode)
    if (this.employeeId) {
      requestHeaders['X-Employee-ID'] = this.employeeId;
    }

    // Add auth token (priority: override > token store)
    if (!skipAuth) {
      const accessToken = authToken || tokenStore?.getAccessToken();
      if (accessToken) {
        requestHeaders['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);

    // Handle 401 - try token refresh
    if (response.status === 401 && !skipAuth && tokenStore) {
      const refreshed = await this.handleTokenRefresh();
      if (refreshed) {
        // Retry with new token
        const newToken = tokenStore.getAccessToken();
        if (newToken) {
          requestHeaders['Authorization'] = `Bearer ${newToken}`;
          fetchOptions.headers = requestHeaders;
          response = await fetch(`${this.baseUrl}${endpoint}`, fetchOptions);
        }
      }
    }

    // Handle errors
    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        message: 'An error occurred',
      };

      try {
        const errorBody = await response.json();
        error.message = errorBody.message || errorBody.error || 'An error occurred';
        error.errors = errorBody.errors;
      } catch {
        error.message = response.statusText || 'An error occurred';
      }

      throw error;
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  // Convenience methods
  get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Export class for testing
export { ApiClient };
