import api, { ApiResponse } from './api';

// Environment-aware OAuth configuration
const getOAuthConfig = () => {
  const config = {
    environment: import.meta.env.MODE || 'development',
    frontendUrl: import.meta.env.VITE_FRONTEND_URL || window.location.origin,
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
    googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    linkedinClientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
    googleRedirectUri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    linkedinRedirectUri: import.meta.env.VITE_LINKEDIN_REDIRECT_URI,
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true'
  };

  if (config.debugMode) {
    console.log('🔧 OAuth Configuration:', {
      environment: config.environment,
      frontendUrl: config.frontendUrl,
      backendUrl: config.backendUrl,
      googleConfigured: !!config.googleClientId && !config.googleClientId.startsWith('your_'),
      linkedinConfigured: !!config.linkedinClientId && !config.linkedinClientId.startsWith('your_')
    });
  }

  return config;
};

// Enhanced Auth types
export interface AuthMethod {
  method: 'password' | 'google' | 'linkedin' | 'facebook' | 'github' | 'otp';
  isAvailable: boolean;
  isPrimary?: boolean;
}

export interface SocialProvider {
  provider: string;
  providerId: string;
  isPrimary: boolean;
}

export interface AuthDetectionResult {
  exists: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isVerified: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    profileCompleted: boolean;
  };
  methods: string[];
  socialProviders: SocialProvider[];
  suggestions: string[];
  message: string;
  nextStep: string;
  requiresVerification: boolean;
  requiresApproval: boolean;
  error?: boolean;
}

export interface EnhancedLoginRequest {
  email: string;
  password?: string;
  otpCode?: string;
  loginMethod?: 'password' | 'otp';
}

// Step 1: Essential signup fields (initial registration)
export interface EssentialSignupRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: 'project_owner' | 'investor';
}

// Step 2: Profile completion fields (post-verification)
export interface ProfileCompletionRequest {
  location?: string;
  phone?: string;
  website_url?: string;
  linkedin_url?: string;
  bio?: string;
  // Investor-specific fields
  investment_focus?: string;
  investment_range?: string;
  investment_categories?: string[];
  accredited_investor?: boolean;
}

// Combined interface for resubmission (maintains backward compatibility)
export interface EnhancedSignupRequest extends EssentialSignupRequest, ProfileCompletionRequest {}

export interface OTPVerificationRequest {
  email: string;
  otpCode: string;
}

export interface EnhancedUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'project_owner' | 'investor';
  company?: string;
  location?: string;
  is_verified: boolean;
  approval_status: 'pending' | 'approved' | 'rejected';
  profile_completion_step?: string;
  avatar_url?: string;
  auth_methods?: AuthMethod[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: EnhancedUser;
  accessToken: string;
  refreshToken: string;
  nextStep?: string;
  requiresVerification?: boolean;
  requiresApproval?: boolean;
  isNewUser?: boolean;
}

// Enhanced Auth service
class AuthEnhancedService {

  // Detect authentication methods for an email
  async detectAuthMethods(email: string): Promise<ApiResponse<AuthDetectionResult>> {
    try {
      const response = await api.post<AuthDetectionResult>('/auth-enhanced/detect-auth', {
        email
      });
      return response;
    } catch (error) {
      console.error('Auth detection error:', error);
      return {
        data: null,
        error: 'Failed to detect authentication methods'
      };
    }
  }

  // Enhanced signup with OTP verification
  async signup(userData: EnhancedSignupRequest): Promise<ApiResponse<{
    userId: string;
    requiresVerification: boolean;
    otpSent: boolean;
    nextStep: string;
  }>> {
    try {
      const response = await api.post('/auth-enhanced/signup-enhanced', userData);
      return response;
    } catch (error) {
      console.error('Enhanced signup error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Signup failed'
      };
    }
  }

  // Resubmit application after rejection
  async resubmitApplication(userData: EnhancedSignupRequest): Promise<ApiResponse<{
    userId: string;
    message: string;
    nextStep: string;
  }>> {
    try {
      const response = await api.post('/auth-enhanced/resubmit-application', userData);
      return response;
    } catch (error) {
      console.error('Resubmit application error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Resubmission failed'
      };
    }
  }

  // Verify email with OTP
  async verifyEmail(data: OTPVerificationRequest): Promise<ApiResponse<{
    user: EnhancedUser;
    nextStep: string;
  }>> {
    try {
      const response = await api.post('/auth-enhanced/verify-email', data);
      return response;
    } catch (error) {
      console.error('Email verification error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Email verification failed'
      };
    }
  }

  // Enhanced login with intelligent method detection
  async login(data: EnhancedLoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>('/auth-enhanced/login-enhanced', data);
      if (response.data) {
        // Store tokens and user data
        this.setTokens(response.data.accessToken, response.data.refreshToken);
        this.setUser(response.data.user);
      }

      return response;
    } catch (error) {
      console.error('Enhanced login error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  // Request OTP for login (passwordless)
  async requestLoginOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth-enhanced/request-login-otp', { email });
      return response;
    } catch (error) {
      console.error('Request login OTP error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send login code'
      };
    }
  }

  // Resend OTP
  async resendOTP(email: string, type: 'email_verification' | 'login' = 'email_verification'): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth-enhanced/resend-otp', { email, type });
      return response;
    } catch (error) {
      console.error('Resend OTP error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to resend OTP'
      };
    }
  }

  // Get OAuth authorization URL
  async getOAuthURL(provider: 'google' | 'linkedin', redirectUri?: string): Promise<ApiResponse<{
    authUrl: string;
    state: string;
    provider: string;
  }>> {
    try {
      const config = getOAuthConfig();
      const params = new URLSearchParams();

      // Use environment-specific redirect URI if not provided
      if (redirectUri) {
        params.append('redirect_uri', redirectUri);
      } else {
        const envRedirectUri = provider === 'google'
          ? config.googleRedirectUri
          : config.linkedinRedirectUri;

        if (envRedirectUri) {
          params.append('redirect_uri', envRedirectUri);
          if (config.debugMode) {
            console.log(`🔗 Using ${provider} redirect URI from env:`, envRedirectUri);
          }
        }
      }

      const response = await api.get(`/auth-enhanced/oauth/url/${provider}?${params.toString()}`);
      return response;
    } catch (error) {
      console.error('OAuth URL error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get OAuth URL'
      };
    }
  }

  // Exchange OAuth code for tokens
  async exchangeOAuthCode(provider: 'google' | 'linkedin', code: string, state?: string, redirectUri?: string): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await api.post<AuthResponse>(`/auth-enhanced/oauth/exchange/${provider}`, {
        code,
        state,
        redirect_uri: redirectUri
      });

      if (response.data) {
        // Store tokens and user data
        this.setTokens(response.data.accessToken, response.data.refreshToken);
        this.setUser(response.data.user);
      }

      return response;
    } catch (error) {
      console.error('OAuth exchange error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'OAuth authentication failed'
      };
    }
  }

  // Get enhanced user profile
  async getCurrentUser(): Promise<ApiResponse<{ user: EnhancedUser }>> {
    try {
      const response = await api.get<{ user: EnhancedUser }>('/auth-enhanced/me-enhanced');
      return response;
    } catch (error) {
      console.error('Get enhanced profile error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to fetch user profile'
      };
    }
  }

  // Token management (same as original auth service)
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('zuvomo_access_token', accessToken);
    localStorage.setItem('zuvomo_refresh_token', refreshToken);
  }

  private setUser(user: EnhancedUser): void {
    localStorage.setItem('zuvomo_user', JSON.stringify(user));
  }

  // Helper methods (enhanced versions)
  isAuthenticated(): boolean {
    return !!localStorage.getItem('zuvomo_access_token');
  }

  getUser(): EnhancedUser | null {
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

  isVerified(): boolean {
    const user = this.getUser();
    return user ? user.is_verified : false;
  }

  // Clear authentication data
  clearAuth(): void {
    localStorage.removeItem('zuvomo_access_token');
    localStorage.removeItem('zuvomo_refresh_token');
    localStorage.removeItem('zuvomo_user');
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  // Forgot Password - Request OTP
  async forgotPassword(email: string): Promise<ApiResponse<{ email: string; otpSent: boolean; message: string }>> {
    try {
      const response = await api.post('/auth-enhanced/forgot-password', { email });
      return response;
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to send password reset code'
      };
    }
  }

  // Reset Password with OTP
  async resetPassword(email: string, otpCode: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth-enhanced/reset-password', {
        email,
        otpCode,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      };
    }
  }

  // Change Password (authenticated users)
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await api.post('/auth-enhanced/change-password', {
        currentPassword,
        newPassword
      });
      return response;
    } catch (error) {
      console.error('Change password error:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to change password'
      };
    }
  }

  // Check if user can access certain features based on their status
  canAccessFeatures(): {
    canLogin: boolean;
    canCreateProjects: boolean;
    canInvest: boolean;
    message?: string
  } {
    const user = this.getUser();

    if (!user) {
      return { canLogin: false, canCreateProjects: false, canInvest: false };
    }

    if (!user.is_verified) {
      return {
        canLogin: true,
        canCreateProjects: false,
        canInvest: false,
        message: 'Please verify your email to access all features'
      };
    }

    if (user.approval_status === 'rejected') {
      return {
        canLogin: true,
        canCreateProjects: false,
        canInvest: false,
        message: 'Your account has been rejected. Please contact support.'
      };
    }

    if (user.approval_status === 'pending') {
      return {
        canLogin: true,
        canCreateProjects: false,
        canInvest: false,
        message: 'Your account is pending approval. You will receive an email once approved.'
      };
    }

    return { canLogin: true, canCreateProjects: true, canInvest: true };
  }
}

// Create and export singleton instance
const authEnhancedService = new AuthEnhancedService();

export default authEnhancedService;