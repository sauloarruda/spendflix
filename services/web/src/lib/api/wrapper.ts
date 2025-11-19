import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { _ } from '$lib/i18n';
import { translateApiError } from '$lib/i18n/helpers';
import { Configuration, AuthenticationApi, ResponseError, FetchError } from './generated';

/**
 * Custom API error with translated message
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public originalMessage?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Network/connection error
 */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Get API base URL from environment
 */
function getApiBaseUrl(): string {
  if (!browser) return 'http://localhost:3000';
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
}

/**
 * Create API configuration
 */
function createApiConfig(): Configuration {
  return new Configuration({
    basePath: getApiBaseUrl(),
    fetchApi: fetch, // Use native fetch
  });
}

/**
 * Handle API errors and translate them
 */
async function handleApiError(error: any): Promise<never> {
  // Check if it's a ResponseError from the generated client
  if (error instanceof ResponseError && error.response) {
    const response = error.response;
    const status = response.status;

    try {
      // Try to parse error response body
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        if (data?.code) {
          const translatedMessage = translateApiError(data.code, data.message);
          throw new ApiError(translatedMessage, status, data.code, data.message);
        }
      }
      // If no JSON or no code, use generic error based on status
      if (status >= 500) {
        throw new ApiError(get(_)('errors.serverError'), status);
      } else {
        throw new ApiError(get(_)('auth.signup.errors.serverError'), status);
      }
    } catch (e) {
      // If error is already ApiError, re-throw it
      if (e instanceof ApiError) {
        throw e;
      }
      // Otherwise, use generic error
      if (status >= 500) {
        throw new ApiError(get(_)('errors.serverError'), status);
      } else {
        throw new ApiError(get(_)('auth.signup.errors.serverError'), status);
      }
    }
  }

  // Check if it's a FetchError (network error)
  if (error instanceof FetchError) {
    throw new NetworkError(get(_)('auth.signup.errors.connectionError'));
  }

  // Unknown error - treat as network error
  throw new NetworkError(get(_)('auth.signup.errors.connectionError'));
}

/**
 * Create a proxy wrapper that intercepts all API method calls
 * and applies error handling automatically
 */
function createApiProxy<T extends object>(apiInstance: T): T {
  return new Proxy(apiInstance, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      // If it's not a function, return as-is
      if (typeof original !== 'function') {
        return original;
      }

      // Wrap the function to add error handling
      return async function (...args: any[]) {
        try {
          return await original.apply(target, args);
        } catch (error) {
          // If error is already our custom error, re-throw it
          if (error instanceof ApiError || error instanceof NetworkError) {
            throw error;
          }
          // Otherwise, handle and translate the error
          return await handleApiError(error);
        }
      };
    },
  });
}

/**
 * Create API instances with automatic error handling
 */
const authApiInstance = new AuthenticationApi(createApiConfig());

/**
 * Wrapped API client with automatic error handling and i18n integration
 * 
 * All methods from the generated API are available directly.
 * The Proxy automatically handles errors and translates them via i18n.
 * 
 * Usage:
 *   api.auth.signUp({ signupRequest: { name, email } })
 */
export const api = {
  /**
   * Authentication API with automatic error handling
   * All methods are intercepted by Proxy and errors are automatically translated
   */
  auth: createApiProxy(authApiInstance),
} as {
  auth: AuthenticationApi;
};

