import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    } else {
      // The login success will trigger useAuth context to redirect appropriately
      // No need to manually redirect as the Login component handles this
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'founder' | 'investor') => {
    const credentials = {
      admin: { email: 'admin@zuvomo.com', password: 'admin123' },
      founder: { email: 'founder@zuvomo.com', password: 'founder123' },
      investor: { email: 'investor@zuvomo.com', password: 'investor123' }
    };
    
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
  };

  return (
    <>
      {/* Demo Credentials */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</p>
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span><strong>Admin:</strong> admin@zuvomo.com / admin123</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoCredentials('admin')}
              className="text-xs px-2 py-1 h-auto"
            >
              Use
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <span><strong>Project Owner:</strong> founder@zuvomo.com / founder123</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoCredentials('founder')}
              className="text-xs px-2 py-1 h-auto"
            >
              Use
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <span><strong>Investor:</strong> investor@zuvomo.com / investor123</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillDemoCredentials('investor')}
              className="text-xs px-2 py-1 h-auto"
            >
              Use
            </Button>
          </div>
        </div>
      </div>

     
   

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={isLoading}
            className="h-12"
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Footer Links */}
      <div className="text-center mt-6 space-y-3">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/signup" className="font-medium text-brand-blue hover:text-brand-blue/80">
            Sign up
          </a>
        </p>
        <a 
          href="#" 
          className="text-sm text-brand-blue hover:text-brand-blue/80 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            alert('Password reset functionality would be implemented here.');
          }}
        >
          Forgot your password?
        </a>
      </div>

         {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-4 text-sm text-gray-500 bg-white">Or continue with email</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

  <div className="space-y-3 mb-6">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-3 py-3"
          onClick={() => alert('Google OAuth integration would be implemented here.\n\nFor demo, use the email login with demo credentials.')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-3 py-3"
          onClick={() => alert('Twitter OAuth integration would be implemented here.\n\nFor demo, use the email login with demo credentials.')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#1DA1F2">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          Continue with Twitter
        </Button>
      </div>
    </>
  );
};

export default LoginForm;