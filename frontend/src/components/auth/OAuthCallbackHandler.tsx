import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface OAuthCallbackHandlerProps {
  onSuccess?: (userData: any) => void;
  onError?: (error: string) => void;
}

export const OAuthCallbackHandler: React.FC<OAuthCallbackHandlerProps> = ({
  onSuccess,
  onError
}) => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setIsProcessing(true);

        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        const userData = urlParams.get('user');
        const error = urlParams.get('error');
        const status = urlParams.get('status');
        const provider = urlParams.get('provider');
        const isNewSignup = urlParams.get('isNewSignup') === 'true';

        // Check for errors first
        if (error) {
          const errorMessages: { [key: string]: string } = {
            'oauth_cancelled': 'OAuth authentication was cancelled',
            'oauth_failed': 'OAuth authentication failed',
            'invalid_state': 'Invalid OAuth state token',
            'callback_failed': 'OAuth callback processing failed'
          };

          const errorMessage = errorMessages[error] || `OAuth error: ${error}`;
          setStatus('error');
          setMessage(errorMessage);

          if (onError) {
            onError(errorMessage);
          }

          // Redirect to signup page after delay
          setTimeout(() => {
            navigate('/signup');
          }, 3000);
          return;
        }

        // Handle different OAuth statuses from backend
        if (status === 'success' && accessToken && userData) {
          // User is approved and profile complete - successful login
          try {
            const parsedUserData = JSON.parse(decodeURIComponent(userData));

            // Store tokens
            localStorage.setItem('zuvomo_access_token', accessToken);
            if (refreshToken) {
              localStorage.setItem('zuvomo_refresh_token', refreshToken);
            }
            localStorage.setItem('zuvomo_user', JSON.stringify(parsedUserData));

            setStatus('success');
            setMessage(`Login successful via ${provider}! Redirecting to dashboard...`);

            if (onSuccess) {
              onSuccess(parsedUserData);
            }

            // Redirect based on user role
            setTimeout(() => {
              const userRole = parsedUserData.role || parsedUserData.user_type;
              switch (userRole) {
                case 'admin':
                  navigate('/admin');
                  break;
                case 'project_owner':
                  navigate('/project-owner');
                  break;
                case 'investor':
                  navigate('/investor');
                  break;
                default:
                  navigate('/');
              }
            }, 1500);

          } catch (parseError) {
            console.error('Failed to parse OAuth user data:', parseError);
            setStatus('error');
            setMessage('Failed to process OAuth authentication');

            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else if (status === 'pending' && userData) {
          // User exists but is pending approval
          try {
            const parsedUserData = JSON.parse(decodeURIComponent(userData));
            setStatus('success');

            if (isNewSignup) {
              setMessage(`Welcome! Your ${provider} account has been created and is pending approval. You'll be notified once approved.`);
            } else {
              setMessage(`${provider} login successful! Your account is pending approval...`);
            }

            // Store OAuth user data with signup flag for login form
            sessionStorage.setItem('oauth_user_data', JSON.stringify({
              ...parsedUserData,
              isOAuthUser: true,
              oauthProvider: provider,
              isNewSignup: isNewSignup
            }));

            if (onSuccess) {
              onSuccess(parsedUserData);
            }

            // Redirect to login form which will show pending screen
            setTimeout(() => {
              navigate('/login?status=pending&email=' + encodeURIComponent(parsedUserData.email) + '&oauth=true');
            }, 1500);

          } catch (parseError) {
            console.error('Failed to parse OAuth user data:', parseError);
            setStatus('error');
            setMessage('Failed to process OAuth authentication');

            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else if (status === 'rejected' && userData) {
          // User exists but was rejected
          try {
            const parsedUserData = JSON.parse(decodeURIComponent(userData));
            setStatus('success');
            setMessage(`${provider} authentication successful! Redirecting to resubmission form...`);

            // Store OAuth user data with signup flag for login form
            sessionStorage.setItem('oauth_user_data', JSON.stringify({
              ...parsedUserData,
              isOAuthUser: true,
              oauthProvider: provider,
              isNewSignup: isNewSignup
            }));

            if (onSuccess) {
              onSuccess(parsedUserData);
            }

            // Redirect to login form which will show rejection screen
            setTimeout(() => {
              navigate('/login?status=rejected&email=' + encodeURIComponent(parsedUserData.email) + '&oauth=true');
            }, 1500);

          } catch (parseError) {
            console.error('Failed to parse OAuth user data:', parseError);
            setStatus('error');
            setMessage('Failed to process OAuth authentication');

            setTimeout(() => {
              navigate('/login');
            }, 3000);
          }
        } else if (status === 'profile_incomplete' && userData) {
          // User is approved but needs to complete profile
          try {
            const parsedUserData = JSON.parse(decodeURIComponent(userData));
            setStatus('success');
            setMessage(`${provider} authentication successful! Please complete your profile...`);

            // Store OAuth user data with signup flag
            sessionStorage.setItem('oauth_user_data', JSON.stringify({
              ...parsedUserData,
              isOAuthUser: true,
              oauthProvider: provider,
              isNewSignup: isNewSignup
            }));

            if (onSuccess) {
              onSuccess(parsedUserData);
            }

            // Redirect to profile completion or signup form
            setTimeout(() => {
              navigate('/signup?step=complete-profile&email=' + encodeURIComponent(parsedUserData.email) + '&oauth=true');
            }, 1500);

          } catch (parseError) {
            console.error('Failed to parse OAuth user data:', parseError);
            setStatus('error');
            setMessage('Failed to process OAuth authentication');

            setTimeout(() => {
              navigate('/signup');
            }, 3000);
          }
        } else {
          // Missing required parameters or unknown status
          setStatus('error');
          setMessage('Invalid OAuth callback - missing required parameters');

          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }

      } catch (error) {
        console.error('OAuth callback handling error:', error);
        setStatus('error');
        setMessage('Failed to process OAuth callback');

        if (onError) {
          onError('Failed to process OAuth callback');
        }

        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, [navigate, onSuccess, onError]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-16 h-16 animate-spin text-blue-600" />;
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          {getStatusIcon()}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {status === 'processing' && 'Processing Authentication'}
          {status === 'success' && 'Authentication Successful'}
          {status === 'error' && 'Authentication Failed'}
        </h3>

        <p className="text-gray-600 mb-6">{message}</p>

        {status === 'processing' && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>Please wait...</span>
          </div>
        )}

        {status === 'error' && (
          <button
            onClick={() => navigate('/signup')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
          >
            Go to Signup
          </button>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackHandler;