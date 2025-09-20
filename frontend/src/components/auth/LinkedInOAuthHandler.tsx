import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import authEnhancedService from '../../services/authEnhanced';

interface LinkedInOAuthHandlerProps {
  onSuccess: (userData: LinkedInUserData) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface LinkedInUserData {
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  company?: string;
  position?: string;
  avatar?: string;
  isVerified: boolean;
}

export const LinkedInOAuthHandler: React.FC<LinkedInOAuthHandlerProps> = ({
  onSuccess,
  onError,
  disabled = false,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLinkedInAuth = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);

    try {
      // Generate redirect URI for signup flow
      const redirectUri = `http://localhost:3001/api/auth-enhanced/oauth/linkedin/callback`;

      // Get OAuth authorization URL
      const response = await authEnhancedService.getOAuthURL('linkedin', redirectUri);

      if (response.data && response.data.data && response.data.data.authUrl) {
        // Store signup intent in sessionStorage
        sessionStorage.setItem('oauth_signup_intent', 'true');
        sessionStorage.setItem('oauth_provider', 'linkedin');

        // Redirect to LinkedIn OAuth
        window.location.href = response.data.data.authUrl;
      } else {
        throw new Error(response.error || 'Failed to get LinkedIn authorization URL');
      }
    } catch (error) {
      console.error('LinkedIn OAuth initiation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to start LinkedIn authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLinkedInAuth}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center space-x-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0077B5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      )}
      <span className="text-gray-700 font-medium">
        {isLoading ? 'Connecting to LinkedIn...' : 'Continue with LinkedIn'}
      </span>
    </button>
  );
};

// Utility function to parse LinkedIn OAuth callback data from URL parameters
export const parseLinkedInOAuthCallback = (): LinkedInUserData | null => {
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
      company: parsed.company || undefined,
      position: parsed.position || undefined,
      avatar: parsed.avatar_url || undefined,
      isVerified: parsed.is_verified || false
    };
  } catch (error) {
    console.error('Error parsing LinkedIn OAuth callback data:', error);
    return null;
  }
};

// Function to check if current page is a LinkedIn OAuth callback for signup
export const isLinkedInOAuthSignupCallback = (): boolean => {
  const isCallback = window.location.pathname === '/auth/oauth-callback';
  const isSignupIntent = sessionStorage.getItem('oauth_signup_intent') === 'true';
  const isLinkedInProvider = sessionStorage.getItem('oauth_provider') === 'linkedin';

  return isCallback && isSignupIntent && isLinkedInProvider;
};

// Function to clear LinkedIn OAuth session data
export const clearLinkedInOAuthSession = (): void => {
  sessionStorage.removeItem('oauth_signup_intent');
  sessionStorage.removeItem('oauth_provider');
};

export default LinkedInOAuthHandler;