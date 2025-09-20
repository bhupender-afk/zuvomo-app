import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/auth/AuthLayout';
import EnhancedLoginForm from '../components/auth/EnhancedLoginForm';

const Login: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [isWideForm, setIsWideForm] = useState(false);

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

  const handleLoginSuccess = () => {
    // The enhanced login form will handle redirects via auth context
    console.log('Login successful - redirecting via auth context');
  };

  const handleSwitchToSignup = () => {
    window.location.href = '/signup';
  };

  const handleLayoutChange = (needsWideLayout: boolean) => {
    setIsWideForm(needsWideLayout);
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
      isWideForm={isWideForm}
    >
      {/* <LoginForm/> */}
      <EnhancedLoginForm
        onSuccess={handleLoginSuccess}
        onSwitchToSignup={handleSwitchToSignup}
        onLayoutChange={handleLayoutChange}
      />
    </AuthLayout>
  );
};

export default Login;