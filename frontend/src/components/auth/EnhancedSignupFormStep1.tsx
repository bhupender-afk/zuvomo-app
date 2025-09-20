import React, { useState } from 'react';
import { Mail, User, Lock, Eye, EyeOff, ArrowRight, Phone, Globe } from 'lucide-react';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { UserTypeSelector } from './UserTypeSelector';
import { GoogleOAuthHandler, GoogleUserData } from './GoogleOAuthHandler';
import { LinkedInOAuthHandler, LinkedInUserData } from './LinkedInOAuthHandler';

interface EnhancedSignupFormStep1Props {
  onNext: (data: SignupStep1Data) => void;
  initialData?: Partial<SignupStep1Data>;
}

export interface SignupStep1Data {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'investor' | 'project_owner' | '';
  company?: string;
  phone?: string;
  websiteUrl?: string;
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export const EnhancedSignupFormStep1: React.FC<EnhancedSignupFormStep1Props> = ({
  onNext,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<SignupStep1Data>({
    fullName: initialData.fullName || '',
    email: initialData.email || '',
    password: initialData.password || '',
    confirmPassword: initialData.confirmPassword || '',
    userType: initialData.userType || '',
    company: initialData.company || '',
    phone: initialData.phone || '',
    websiteUrl: initialData.websiteUrl || '',
    agreeToTerms: initialData.agreeToTerms || false,
    agreeToMarketing: initialData.agreeToMarketing || false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<SignupStep1Data>>({});
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthUserData, setOauthUserData] = useState<any>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<SignupStep1Data> = {};

    // Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // User type validation
    if (!formData.userType) {
      newErrors.userType = 'Please select your role';
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
    }

    // Website URL validation (optional but if provided should be valid)
    if (formData.websiteUrl && formData.websiteUrl.trim()) {
      try {
        new URL(formData.websiteUrl);
      } catch {
        newErrors.websiteUrl = 'Please enter a valid URL (e.g., https://example.com)';
      }
    }

    // Terms validation
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleInputChange = (field: keyof SignupStep1Data) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const isPasswordStrong = () => {
    const requirements = [
      formData.password.length >= 8,
      /[A-Z]/.test(formData.password),
      /[a-z]/.test(formData.password),
      /\d/.test(formData.password),
      /[!@#$%^&*(),.?\":{}|<>]/.test(formData.password),
    ];
    return requirements.filter(Boolean).length >= 4;
  };

  // Handle Google OAuth success
  const handleGoogleOAuthSuccess = (userData: GoogleUserData) => {
    setOauthUserData({ ...userData, provider: 'Google' });
    setFormData(prev => ({
      ...prev,
      fullName: userData.fullName,
      email: userData.email,
      // Skip password fields for OAuth users
      password: 'oauth-user-no-password',
      confirmPassword: 'oauth-user-no-password',
    }));
    setOauthError(null);

    // Auto-submit form for OAuth users
    setTimeout(() => {
      onNext({
        ...formData,
        fullName: userData.fullName,
        email: userData.email,
        password: 'oauth-user-no-password',
        confirmPassword: 'oauth-user-no-password',
      });
    }, 100);
  };

  // Handle LinkedIn OAuth success
  const handleLinkedInOAuthSuccess = (userData: LinkedInUserData) => {
    setOauthUserData({ ...userData, provider: 'LinkedIn' });
    setFormData(prev => ({
      ...prev,
      fullName: userData.fullName,
      email: userData.email,
      company: userData.company || prev.company,
      // Skip password fields for OAuth users
      password: 'oauth-user-no-password',
      confirmPassword: 'oauth-user-no-password',
    }));
    setOauthError(null);

    // Auto-submit form for OAuth users
    setTimeout(() => {
      onNext({
        ...formData,
        fullName: userData.fullName,
        email: userData.email,
        company: userData.company || formData.company,
        password: 'oauth-user-no-password',
        confirmPassword: 'oauth-user-no-password',
      });
    }, 100);
  };

  // Handle OAuth errors
  const handleOAuthError = (error: string) => {
    setOauthError(error);
  };

  // For OAuth users, skip password validation
  const isOAuthUser = formData.password === 'oauth-user-no-password';
  const canSubmit = formData.fullName && formData.email &&
                   formData.password && formData.confirmPassword && formData.userType &&
                   formData.agreeToTerms &&
                   (isOAuthUser || (isPasswordStrong() && formData.password === formData.confirmPassword));

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
        <p className="text-gray-600">Join the Zuvomo investment community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4" />
            <span>Full Name *</span>
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={handleInputChange('fullName')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.fullName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
        </div>

        {/* Email Field */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4" />
            <span>Email Address *</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Password Fields - Hide for OAuth users */}
        {!isOAuthUser && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4" />
                  <span>Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4" />
                  <span>Confirm Password *</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={formData.password} />
          </>
        )}

        {/* OAuth User Notice */}
        {isOAuthUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-800 text-sm">
                You're signing up with {oauthUserData?.provider || 'social login'}. Complete your profile to continue.
              </p>
            </div>
          </div>
        )}

        {/* User Type Selection */}
        <div>
          <UserTypeSelector
            selectedType={formData.userType}
            onChange={(type) => {
              setFormData(prev => ({ ...prev, userType: type }));
              if (errors.userType) {
                setErrors(prev => ({ ...prev, userType: undefined }));
              }
            }}
          />
          {errors.userType && <p className="text-red-500 text-sm mt-1">{errors.userType}</p>}
        </div>

        {/* Company Field (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company/Organization (optional)
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={handleInputChange('company')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Enter your company name"
          />
        </div>

        {/* Phone and Website Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4" />
              <span>Phone Number (optional)</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={handleInputChange('phone')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+1 (555) 123-4567"
            />
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4" />
              <span>Website (optional)</span>
            </label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={handleInputChange('websiteUrl')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.websiteUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://yourcompany.com"
            />
            {errors.websiteUrl && <p className="text-red-500 text-sm mt-1">{errors.websiteUrl}</p>}
          </div>
        </div>

        {/* Agreements */}
        <div className="space-y-3">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleInputChange('agreeToTerms')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> *
            </span>
          </label>
          {errors.agreeToTerms && <p className="text-red-500 text-sm">{errors.agreeToTerms}</p>}

          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={formData.agreeToMarketing}
              onChange={handleInputChange('agreeToMarketing')}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              I would like to receive updates about investment opportunities and platform news
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Continue to Profile Setup</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline font-medium">
            Sign in here
          </a>
        </p>
      </div>

      {/* Social Login Options */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center">
          <div className="flex-1 border-t border-gray-200"></div>
          <div className="px-4 text-sm text-gray-500">or continue with</div>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoogleOAuthHandler
            onSuccess={handleGoogleOAuthSuccess}
            onError={handleOAuthError}
          />

          <LinkedInOAuthHandler
            onSuccess={handleLinkedInOAuthSuccess}
            onError={handleOAuthError}
          />
        </div>

        {/* OAuth Error Display */}
        {oauthError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{oauthError}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedSignupFormStep1;