import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ModularSignupForm from '../components/auth/ModularSignupForm';

const Signup: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role || user.user_type) {
        case 'admin':
          window.location.href = '/admin';
          break;
        case 'project_owner':
          window.location.href = '/project-owner';
          break;
        case 'investor':
          window.location.href = '/investor';
          break;
        default:
          window.location.href = '/';
          break;
      }
    }
  }, [isAuthenticated, user]);

  const handleSignupSuccess = () => {
    // Modular signup form handles the complete flow including waiting screen
    console.log('Signup process initiated - user will be notified of approval status');
  };

  const handleSignupError = (error: string) => {
    console.error('Signup error:', error);
    // Could add toast notification here if needed
  };

  return (
    <ModularSignupForm
      onSuccess={handleSignupSuccess}
      onError={handleSignupError}
    />
  );
};

export default Signup;