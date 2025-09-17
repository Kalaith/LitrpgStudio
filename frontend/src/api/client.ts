// API Client for LitRPG Studio Backend

// Type definitions - using class instead of interface to survive compilation
export class ApiResponse<T = any> {
  success: boolean = false;
  data?: T;
  error?: string;
  message?: string;
}

export class ApiError extends Error {
  public status: number;
  public response?: any;

  constructor(
    message: string,
    status: number = 500,
    response?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

class ApiClient {
  private baseUrl: string;
  private version: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    this.version = import.meta.env.VITE_API_VERSION || 'v1';
  }

  private getUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/api/${this.version}/${cleanEndpoint}`;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.getUrl(endpoint);

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (import.meta.env.VITE_DEBUG_API === 'true') {
      console.log(`API Request: ${config.method || 'GET'} ${url}`, {
        body: config.body,
        headers: config.headers
      });
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (import.meta.env.VITE_DEBUG_API === 'true') {
        console.log(`API Response: ${response.status}`, data);
      }

      if (!response.ok) {
        throw new ApiError(
          data.error || data.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data as ApiResponse<T>;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('API Request failed:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // HTTP Methods
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      // Backend returns {status: "healthy"} not {success: true}
      return response.status === 'healthy' || response.success === true;
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