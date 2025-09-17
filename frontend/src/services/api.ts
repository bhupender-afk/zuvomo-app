const API_BASE_URL = '/api';

// API response types
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// API client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(contentType: string = 'application/json'): HeadersInit {
    const token = localStorage.getItem('zuvomo_access_token');
    const headers: HeadersInit = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      console.log(`[API] Handling response - Status: ${response.status}, ContentType: ${response.headers.get('content-type')}`);
      
      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses (like text or empty responses)
        const text = await response.text();
        console.log(`[API] Non-JSON response text:`, text);
        if (text) {
          try {
            // Try to parse as JSON in case content-type header is missing
            data = JSON.parse(text);
          } catch {
            // If it's not JSON, treat as plain text response
            data = { 
              message: text,
              success: response.ok
            };
          }
        } else {
          // Empty response
          data = { 
            message: response.ok ? 'Success' : 'Error occurred',
            success: response.ok
          };
        }
      }
      
      if (!response.ok) {
        console.error(`[API] Error response:`, data);
        // Handle authentication errors
        if (response.status === 401) {
          this.handleAuthError();
        }
        return { error: data.error || data.message || `HTTP ${response.status}: ${response.statusText}` };
      }
      
      console.log(`[API] Success response:`, data);
      return { data };
    } catch (error) {
      console.error('[API] Response parsing error:', error);
      return { 
        error: `Failed to parse response: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private handleAuthError() {
    localStorage.removeItem('zuvomo_access_token');
    localStorage.removeItem('zuvomo_refresh_token');
    localStorage.removeItem('zuvomo_user');
    window.location.href = '/login';
  }

  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });
      
      return this.handleResponse<T>(response);
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  async uploadFile<T = any>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    try {
      console.log(`API: Uploading file to ${endpoint}`);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getAuthHeaders(''), // Don't set Content-Type for FormData
        body: formData,
      });
      
      console.log(`API: Upload response status: ${response.status} ${response.statusText}`);
      
      const result = await this.handleResponse<T>(response);
      
      if (result.error) {
        console.error(`API: Upload failed for ${endpoint}:`, result.error);
      } else {
        console.log(`API: Upload successful for ${endpoint}`);
      }
      
      return result;
    } catch (error) {
      console.error(`API: Network error during file upload to ${endpoint}:`, error);
      return { 
        error: `Network error during file upload: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

// Create API client instance
const api = new ApiClient(API_BASE_URL);

export default api;
export type { ApiResponse };