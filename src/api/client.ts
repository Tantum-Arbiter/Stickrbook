/**
 * API Client for StickrBook
 *
 * Centralized HTTP client with:
 * - Error handling and retry logic
 * - Request/response type safety
 * - SSE support for job progress
 */

// Backend API base - proxied through Vite in dev, direct in production
export const API_BASE = '/v1/storyboard';

export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  retry?: number;
  retryDelay?: number;
}

/**
 * Make an API request with error handling and retry
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, retry = 0, retryDelay = 1000, ...fetchOptions } = options;

  const url = `${API_BASE}${path}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  const config: RequestInit = {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  let lastError: ApiClientError | null = null;
  let attempts = 0;

  while (attempts <= retry) {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorBody = await response.text();
        let detail: string | undefined;
        try {
          const parsed = JSON.parse(errorBody);
          detail = parsed.detail || parsed.message;
        } catch {
          detail = errorBody;
        }

        throw new ApiClientError(
          response.status,
          `API Error: ${response.status} ${response.statusText}`,
          detail
        );
      }

      // Handle empty responses
      const text = await response.text();
      if (!text) return {} as T;

      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        lastError = error;
      } else if (error instanceof TypeError) {
        // Network error
        lastError = new ApiClientError(0, 'Network error - is the server running?');
      } else {
        throw error;
      }

      attempts++;
      if (attempts <= retry) {
        await new Promise((r) => setTimeout(r, retryDelay * attempts));
      }
    }
  }

  throw lastError || new ApiClientError(500, 'Unknown error');
}

// Convenience methods
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};

export default api;

