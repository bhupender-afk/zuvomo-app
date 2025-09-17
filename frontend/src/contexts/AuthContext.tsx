import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import authService, { User } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  isApproved: () => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get current user
          const response = await authService.getCurrentUser();
          
          if (response.data) {
            setUser(response.data.user);
          } else {
            // Token might be expired, try to refresh
            const refreshSuccess = await authService.refreshToken();
            
            if (refreshSuccess) {
              const userResponse = await authService.getCurrentUser();
              if (userResponse.data) {
                setUser(userResponse.data.user);
              }
            } else {
              // Clear invalid auth state
              await authService.logout();
            }
          }
        } else {
          // Check if user data exists in localStorage (backup)
          const storedUser = authService.getUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    console.log('AuthContext: Starting login for', email);
    
    try {
      const response = await authService.login({ email, password });
      console.log('AuthContext: Login response', response);
      
      if (response.data && response.data.user) {
        const userData = response.data.user;
        console.log('AuthContext: User data received', userData);
        setUser(userData);
        setIsLoading(false);
        return { success: true };
      } else {
        console.error('AuthContext: Login failed', response.error);
        setIsLoading(false);
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      console.error('AuthContext: Login network error', error);
      setIsLoading(false);
      return { success: false, error: 'Network error' };
    }
  };

  const signup = async (userData: any) => {
    setIsLoading(true);
    
    try {
      const response = await authService.signup(userData);
      
      if (response.data) {
        setUser(response.data.user);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: response.error || 'Signup failed' };
      }
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await authService.logout();
    setUser(null);
    setIsLoading(false);
    
    // Redirect to home page
    window.location.href = '/';
  };

  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isApproved = (): boolean => {
    return user ? user.approval_status === 'approved' : false;
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.data) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    hasRole,
    isApproved,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;