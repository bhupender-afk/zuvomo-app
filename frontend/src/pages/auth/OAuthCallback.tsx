import React from 'react';
import { useNavigate } from 'react-router-dom';
import { OAuthCallbackHandler } from '../../components/auth/OAuthCallbackHandler';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  const handleOAuthSuccess = (userData: any) => {
    console.log('OAuth success:', userData);
  };

  const handleOAuthError = (error: string) => {
    console.error('OAuth error:', error);
    // Could show a toast or redirect to error page
  };

  return (
    <OAuthCallbackHandler
      onSuccess={handleOAuthSuccess}
      onError={handleOAuthError}
    />
  );
};

export default OAuthCallback;