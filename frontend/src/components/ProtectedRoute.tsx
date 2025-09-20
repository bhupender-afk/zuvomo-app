import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireApproval = true 
}) => {
  const { isAuthenticated, user, isLoading, hasRole, isApproved,logout } = useAuth();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Auth state check', {
      isLoading,
      isAuthenticated,
      user: user?.role,
      allowedRoles,
      requireApproval
    });

    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('ProtectedRoute: Not authenticated, redirecting to login');
        window.location.href = '/login';
        return;
      }

      if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
        console.log('ProtectedRoute: User role not in allowed roles', {
          userRole: user?.role,
          allowedRoles,
          hasRole: hasRole(allowedRoles)
        });
        
        // Don't redirect if already on correct page
        const currentPath = window.location.pathname;
        if (user) {
          let targetPath = '';
          switch (user.role) {
            case 'admin':
              targetPath = '/admin';
              break;
            case 'project_owner':
              targetPath = '/project-owner';
              break;
            case 'investor':
              targetPath = '/investor';
              break;
            default:
              targetPath = '/';
              break;
          }
          
          if (currentPath !== targetPath) {
            console.log('ProtectedRoute: Redirecting to correct dashboard', targetPath);
            window.location.href = targetPath;
            return;
          }
        }
      }

      if (requireApproval && user?.role !== 'admin' && !isApproved()) {
        console.log('ProtectedRoute: User needs approval', {
          userRole: user?.role,
          isApproved: isApproved(),
          approvalStatus: user?.approval_status
        });
        setShowContent(false);
        return;
      }

      console.log('ProtectedRoute: All checks passed, showing content');
      setShowContent(true);
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, hasRole, isApproved, requireApproval]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (requireApproval && user?.role !== 'admin' && !isApproved()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Under Review</h2>
            <p className="text-gray-600 mb-6">
              Your account is currently being reviewed by our admin team. 
              You'll receive an email notification once your account is approved.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                <strong>Account Status:</strong> {user?.approval_status}
              </p>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-brand-blue/90 transition-colors"
              >
                Return to Homepage
              </button>
              <button
                onClick={logout}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;