import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

const Signup: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
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

  return (
    <AuthLayout
      title="Join Zuvomo"
      subtitle="Create your account to get started"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;