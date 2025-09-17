import api, { ApiResponse } from './api';

// Auth types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'project_owner' | 'investor';
  company?: string;
  location?: string;
  is_verified: boolean;
  approval_status: 'approved' | 'pending' | 'rejected';
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'project_owner' | 'investor';
  company?: string;
  location?: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Auth service
class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    if (response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);
    }
    
    return response;
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post<AuthResponse>('/auth/signup', userData);
    
    if (response.data) {
      this.setTokens(response.data.accessToken, response.data.refreshToken);
      this.setUser(response.data.user);
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return api.get<{ user: User }>('/auth/me');
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('zuvomo_refresh_token');
    
    if (!refreshToken) {
      return false;
    }

    try {
      const response = await api.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken
      });

      if (response.data) {
        this.setTokens(response.data.accessToken, response.data.refreshToken);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }

    this.clearAuth();
    return false;
  }

  // Token management
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('zuvomo_access_token', accessToken);
    localStorage.setItem('zuvomo_refresh_token', refreshToken);
  }

  private setUser(user: User): void {
    localStorage.setItem('zuvomo_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    localStorage.removeItem('zuvomo_access_token');
    localStorage.removeItem('zuvomo_refresh_token');
    localStorage.removeItem('zuvomo_user');
  }

  // Helper methods
  isAuthenticated(): boolean {
    return !!localStorage.getItem('zuvomo_access_token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('zuvomo_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('zuvomo_access_token');
  }

  hasRole(requiredRoles: string[]): boolean {
    const user = this.getUser();
    return user ? requiredRoles.includes(user.role) : false;
  }

  isApproved(): boolean {
    const user = this.getUser();
    return user ? user.approval_status === 'approved' : false;
  }
}

// Create auth service instance
const authService = new AuthService();

export default authService;