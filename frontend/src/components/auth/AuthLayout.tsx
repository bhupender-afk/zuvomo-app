import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy to-brand-blue flex items-center justify-center p-4">
      {/* Back to Home Link */}
      <a 
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Home
      </a>

      <div className="w-full max-w-md">
        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-blue mb-2">
              Zuvomo
            </h1>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-gray-600 text-sm">
              {subtitle}
            </p>
          </div>

          {/* Content */}
          {children}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            © 2024 Zuvomo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;