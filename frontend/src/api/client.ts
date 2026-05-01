// API Client for Writers Studio Backend

// Type definitions - using class instead of interface to survive compilation
export class ApiResponse<T = unknown> {
  success: boolean = false;
  data?: T;
  error?: string;
  message?: string;
  status?: string;
}

export interface ErrorResponse {
  error?: string;
  message?: string;
  success?: boolean;
  [key: string]: unknown;
}

export class ApiError extends Error {
  public status: number;
  public response?: ErrorResponse;

  constructor(message: string, status: number = 500, response?: ErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}

type TokenProvider = () => string | null | Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setTokenProvider(provider: TokenProvider | null): void {
  tokenProvider = provider;
}

export function resolveApiRootUrl(baseUrl: string, version: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanVersion = version.replace(/^\/+|\/+$/g, "");
  const versionedSuffix = `/api/${cleanVersion}`;

  if (cleanBase.endsWith(versionedSuffix)) {
    return cleanBase;
  }

  if (cleanBase.endsWith("/api")) {
    return `${cleanBase}/${cleanVersion}`;
  }

  return `${cleanBase}${versionedSuffix}`;
}

export function buildApiUrl(
  baseUrl: string,
  version: string,
  endpoint: string,
): string {
  const root = resolveApiRootUrl(baseUrl, version);
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${root}/${cleanEndpoint}`;
}

class ApiClient {
  private baseUrl: string;
  private version: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    this.version = import.meta.env.VITE_API_VERSION || "v1";
  }

  private getUrl(endpoint: string): string {
    return buildApiUrl(this.baseUrl, this.version, endpoint);
  }

  private async send<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = this.getUrl(endpoint);

    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (tokenProvider) {
      try {
        const token = await tokenProvider();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
      } catch {
        // Ignore token provider errors and proceed without auth header.
      }
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    if (import.meta.env.VITE_DEBUG_API === "true") {
      console.log(`API Request: ${config.method || "GET"} ${url}`, {
        body: config.body,
        headers: config.headers,
      });
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (import.meta.env.VITE_DEBUG_API === "true") {
        console.log(`API Response: ${response.status}`, data);
      }

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || `HTTP ${response.status}`,
          response.status,
          data,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error("API Request failed:", error);
      throw new ApiError(
        error instanceof Error ? error.message : "Network error",
        0,
      );
    }
  }

  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.send<ApiResponse<T>>(endpoint, options);
  }

  private async rawRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    return this.send<T>(endpoint, options);
  }

  // HTTP Methods
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async rawGet<T = unknown>(endpoint: string): Promise<T> {
    return this.rawRequest<T>(endpoint, { method: "GET" });
  }

  async rawPost<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
    return this.rawRequest<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get("/health");
      // Backend returns {status: "healthy"} not {success: true}
      return response.status === "healthy" || response.success === true;
    } catch {
      return false;
    }
  }
}

// Create and export instance as default
const apiClient = new ApiClient();
export default apiClient;

// Also export as named export for compatibility
export { apiClient };
