import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import authEnhancedService from '../../services/authEnhanced';

interface GoogleOAuthHandlerProps {
  onSuccess: (userData: GoogleUserData) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface GoogleUserData {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar?: string;
  isVerified: boolean;
}

export const GoogleOAuthHandler: React.FC<GoogleOAuthHandlerProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Generate redirect URI for signup flow
      const redirectUri = `http://localhost:3001/api/auth-enhanced/oauth/google/callback`;

      // Get OAuth authorization URL
      const response = await authEnhancedService.getOAuthURL('google', redirectUri);

      if (response.data && response.data.data && response.data.data.authUrl) {
        // Store signup intent in sessionStorage
        sessionStorage.setItem('oauth_signup_intent', 'true');
        sessionStorage.setItem('oauth_provider', 'google');

        // Redirect to Google OAuth
        window.location.href = response.data.data.authUrl;
      } else {
        throw new Error(response.error || 'Failed to get Google authorization URL');
      }
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to start Google authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleAuth}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      <span className="text-gray-700 font-medium">
        {isLoading ? 'Connecting to Google...' : 'Continue with Google'}
      </span>
    </button>
  );
};

// Utility function to parse OAuth callback data from URL parameters
export const parseGoogleOAuthCallback = (): GoogleUserData | null => {
  const urlParams = new URLSearchParams(window.location.search);

  const userData = urlParams.get('user');
  if (!userData) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(userData));

    return {
      email: parsed.email || '',
      firstName: parsed.first_name || '',
      lastName: parsed.last_name || '',
      fullName: `${parsed.first_name || ''} ${parsed.last_name || ''}`.trim(),
      avatar: parsed.avatar_url || undefined,
      isVerified: parsed.is_verified || false
    };
  } catch (error) {
    console.error('Error parsing Google OAuth callback data:', error);
    return null;
  }
};

// Function to check if current page is an OAuth callback for signup
export const isGoogleOAuthSignupCallback = (): boolean => {
  const isCallback = window.location.pathname === '/auth/oauth-callback';
  const isSignupIntent = sessionStorage.getItem('oauth_signup_intent') === 'true';
  const isGoogleProvider = sessionStorage.getItem('oauth_provider') === 'google';

  return isCallback && isSignupIntent && isGoogleProvider;
};

// Function to clear OAuth session data
export const clearGoogleOAuthSession = (): void => {
  sessionStorage.removeItem('oauth_signup_intent');
  sessionStorage.removeItem('oauth_provider');
};

export default GoogleOAuthHandler;