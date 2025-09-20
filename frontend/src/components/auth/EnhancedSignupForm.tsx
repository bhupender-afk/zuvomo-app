import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Building, MapPin, Phone, Globe, Loader2, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import authEnhancedService, { EnhancedSignupRequest } from '../../services/authEnhanced';
import OTPVerification from './OTPVerification';

interface EnhancedSignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const EnhancedSignupForm: React.FC<EnhancedSignupFormProps> = ({
  onSuccess,
  onSwitchToLogin
}) => {
  const [step, setStep] = useState<'form' | 'verification'>('form');
  const [formData, setFormData] = useState<EnhancedSignupRequest>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'investor',
    company: '',
    location: '',
    phone_number: '',
    telegram_handle: '',
    website_url: '',
    linkedin: '',
    investment_focus: '',
    preferred_category: '',
    investment_range: '',
    current_portfolio_size: '',
    past_investments: ''
  });

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Investment categories
  const investmentCategories = [
    'Technology', 'Healthcare', 'Finance', 'Real Estate', 'Energy',
    'Education', 'Retail', 'Manufacturing', 'Agriculture', 'Transportation'
  ];

  // Investment ranges
  const investmentRanges = [
    '$1K - $10K', '$10K - $50K', '$50K - $100K', '$100K - $500K', '$500K+'
  ];

  // Portfolio sizes
  const portfolioSizes = [
    'First time investor', '1-5 investments', '6-15 investments', '16-30 investments', '30+ investments'
  ];

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authEnhancedService.signup(formData);

      if (response.data) {
        setUserId(response.data.userId);
        setSuccess('Account created successfully! Please verify your email.');
        setStep('verification');
      } else {
        setError(response.error || 'Signup failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful verification
  const handleVerificationSuccess = (data: any) => {
    setSuccess('Email verified successfully! Your account is now active.');
    setTimeout(() => {
      onSuccess?.();
    }, 2000);
  };

  // Handle Google OAuth
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate redirect URI for signup flow
      const redirectUri = `http://localhost:3001/api/auth-enhanced/oauth/google/callback`;
      console.log('🚀 Initiating Google OAuth with redirect URI:', redirectUri);

      const response = await authEnhancedService.getOAuthURL('google', redirectUri);
      console.log('📡 OAuth URL response:', response);

      if (response.data && response.data.data && response.data.data.authUrl) {
        console.log('✅ Valid OAuth URL received, redirecting to:', response.data.authUrl);

        // Store signup intent in sessionStorage
        sessionStorage.setItem('oauth_signup_intent', 'true');
        sessionStorage.setItem('oauth_provider', 'google');

        // Redirect to Google OAuth
        window.location.href = response.data.data.authUrl;
      } else {
        console.error('❌ Google OAuth error:', response.error, 'Error code:', response.errorCode);
        if (response.errorCode === 'GOOGLE_CONFIG_MISSING') {
          setError('Google signup is temporarily unavailable. Please use email signup or contact support.');
        } else {
          setError(response.error || 'Failed to initialize Google authentication');
        }
      }
    } catch (error) {
      console.error('💥 Google OAuth initiation error:', error);
      setError('Failed to initialize Google authentication. Please try again or use email signup.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle LinkedIn OAuth
  const handleLinkedInAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Generate redirect URI for signup flow
      const redirectUri = `http://localhost:3001/api/auth-enhanced/oauth/linkedin/callback`;

      const response = await authEnhancedService.getOAuthURL('linkedin', redirectUri);

      if (response.data && response.data.data && response.data.data.authUrl) {
        // Store signup intent in sessionStorage
        sessionStorage.setItem('oauth_signup_intent', 'true');
        sessionStorage.setItem('oauth_provider', 'linkedin');

        // Redirect to LinkedIn OAuth
        window.location.href = response.data.data.authUrl;
      } else {
        console.error('LinkedIn OAuth error:', response.error);
        if (response.errorCode === 'LINKEDIN_CONFIG_MISSING') {
          setError('LinkedIn signup is temporarily unavailable. Please use email signup or contact support.');
        } else {
          setError(response.error || 'Failed to initialize LinkedIn authentication');
        }
      }
    } catch (error) {
      console.error('LinkedIn OAuth initiation error:', error);
      setError('Failed to initialize LinkedIn authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change
  const handleInputChange = (field: keyof EnhancedSignupRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Render form step
  const renderFormStep = () => (
    <div className="space-y-6">
      {/* Social Signup Options */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleLinkedInAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or create account manually</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          I am a:
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.user_type === 'investor' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input
              type="radio"
              name="user_type"
              value="investor"
              checked={formData.user_type === 'investor'}
              onChange={(e) => handleInputChange('user_type', e.target.value as 'investor' | 'project_owner')}
              className="sr-only"
            />
            <div>
              <div className="font-medium text-gray-900">VC</div>
              <div className="text-sm text-gray-500">Looking to invest in projects</div>
            </div>
          </label>

          <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${formData.user_type === 'project_owner' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
            <input
              type="radio"
              name="user_type"
              value="project_owner"
              checked={formData.user_type === 'project_owner'}
              onChange={(e) => handleInputChange('user_type', e.target.value as 'investor' | 'project_owner')}
              className="sr-only"
            />
            <div>
              <div className="font-medium text-gray-900">Project Owner</div>
              <div className="text-sm text-gray-500">Seeking investment for my project</div>
            </div>
          </label>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter first name"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter last name"
              required
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter email address"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter password"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirm password"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Company and Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
            Company/Organization
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="company"
              type="text"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter company name"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter location"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange('phone_number', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div>
          <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="website_url"
              type="url"
              value={formData.website_url}
              onChange={(e) => handleInputChange('website_url', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter website URL"
            />
          </div>
        </div>
      </div>

      {/* Investor-specific fields */}
      {formData.user_type === 'investor' && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900">Investment Preferences</h3>

          <div>
            <label htmlFor="investment_focus" className="block text-sm font-medium text-gray-700 mb-1">
              Investment Focus
            </label>
            <textarea
              id="investment_focus"
              value={formData.investment_focus}
              onChange={(e) => handleInputChange('investment_focus', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your investment focus and interests"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferred_category" className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Category
              </label>
              <select
                id="preferred_category"
                value={formData.preferred_category}
                onChange={(e) => handleInputChange('preferred_category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select category</option>
                {investmentCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="investment_range" className="block text-sm font-medium text-gray-700 mb-1">
                Investment Range
              </label>
              <select
                id="investment_range"
                value={formData.investment_range}
                onChange={(e) => handleInputChange('investment_range', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select range</option>
                {investmentRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="current_portfolio_size" className="block text-sm font-medium text-gray-700 mb-1">
              Current Portfolio Size
            </label>
            <select
              id="current_portfolio_size"
              value={formData.current_portfolio_size}
              onChange={(e) => handleInputChange('current_portfolio_size', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select portfolio size</option>
              {portfolioSizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Success Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Create Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </button>

      {/* Switch to Login */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
      </form>
    </div>
  );

  // Render verification step
  const renderVerificationStep = () => (
    <OTPVerification
      email={formData.email}
      type="email_verification"
      onSuccess={handleVerificationSuccess}
      onBack={() => setStep('form')}
      title="Verify your email"
      description="We sent a verification code to complete your account setup"
    />
  );

  return (
    <div className="space-y-6">
      {step === 'form' && (
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-gray-600">
            Join Zuvomo to start your {formData.user_type === 'investor' ? 'investment' : 'fundraising'} journey
          </p>
        </div>
      )}

      {step === 'form' && renderFormStep()}
      {step === 'verification' && renderVerificationStep()}
    </div>
  );
};

export default EnhancedSignupForm;