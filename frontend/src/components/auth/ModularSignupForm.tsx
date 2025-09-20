import React, { useState, useEffect } from 'react';
import { EnhancedSignupFormStep1, SignupStep1Data } from './EnhancedSignupFormStep1';
import { InvestorProfileCompletion, InvestorProfileData } from './InvestorProfileCompletion';
import { WaitingListScreen } from './WaitingListScreen';
import { OTPVerification } from './OTPVerification';
import {
  parseGoogleOAuthCallback,
  isGoogleOAuthSignupCallback,
  clearGoogleOAuthSession
} from './GoogleOAuthHandler';
import {
  parseLinkedInOAuthCallback,
  isLinkedInOAuthSignupCallback,
  clearLinkedInOAuthSession
} from './LinkedInOAuthHandler';

interface ModularSignupFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type SignupStep = 'step1' | 'otp' | 'profile' | 'waiting';

interface CombinedSignupData extends SignupStep1Data, Partial<InvestorProfileData> {
  // Combined interface for all signup data
}

export const ModularSignupForm: React.FC<ModularSignupFormProps> = ({
  onSuccess,
  onError
}) => {
  const [currentStep, setCurrentStep] = useState<SignupStep>('step1');
  const [signupData, setSignupData] = useState<CombinedSignupData>({
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    company: '',
    phone: '',
    websiteUrl: '',
    agreeToTerms: false,
    agreeToMarketing: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthUserData, setOauthUserData] = useState<any>(null);
  const [isOAuthFlow, setIsOAuthFlow] = useState(false);

  // Detect OAuth callback or stored OAuth data on component mount
  useEffect(() => {
    const detectOAuthCallback = () => {
      // Check for stored OAuth user data from callback handler
      const storedOAuthData = sessionStorage.getItem('oauth_user_data');
      if (storedOAuthData) {
        try {
          const userData = JSON.parse(storedOAuthData);
          setOauthUserData(userData);
          setIsOAuthFlow(true);
          setSignupData(prev => ({
            ...prev,
            fullName: userData.first_name && userData.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : userData.fullName || '',
            firstName: userData.first_name || '',
            lastName: userData.last_name || '',
            email: userData.email || '',
            company: userData.company || prev.company,
            // Default to investor for OAuth users, they can change later
            userType: 'investor',
            agreeToTerms: true, // Implied consent through OAuth
          }));
          // Clear stored data
          sessionStorage.removeItem('oauth_user_data');
          return;
        } catch (error) {
          console.error('Error parsing stored OAuth data:', error);
          sessionStorage.removeItem('oauth_user_data');
        }
      }

      // Check for Google OAuth callback (fallback)
      if (isGoogleOAuthSignupCallback()) {
        const googleData = parseGoogleOAuthCallback();
        if (googleData) {
          setOauthUserData(googleData);
          setIsOAuthFlow(true);
          setSignupData(prev => ({
            ...prev,
            fullName: googleData.fullName,
            firstName: googleData.firstName,
            lastName: googleData.lastName,
            email: googleData.email,
            // Default to investor for OAuth users, they can change later
            userType: 'investor',
            agreeToTerms: true, // Implied consent through OAuth
          }));
          clearGoogleOAuthSession();
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }

      // Check for LinkedIn OAuth callback (fallback)
      if (isLinkedInOAuthSignupCallback()) {
        const linkedinData = parseLinkedInOAuthCallback();
        if (linkedinData) {
          setOauthUserData(linkedinData);
          setIsOAuthFlow(true);
          setSignupData(prev => ({
            ...prev,
            fullName: linkedinData.fullName,
            firstName: linkedinData.firstName,
            lastName: linkedinData.lastName,
            email: linkedinData.email,
            company: linkedinData.company || prev.company,
            // Default to investor for OAuth users, they can change later
            userType: 'investor',
            agreeToTerms: true, // Implied consent through OAuth
          }));
          clearLinkedInOAuthSession();
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          return;
        }
      }
    };

    detectOAuthCallback();
  }, []);

  const handleStep1Complete = async (step1Data: SignupStep1Data) => {
    setSignupData(prev => ({ ...prev, ...step1Data }));

    // For OAuth users, skip password-based signup and proceed directly
    if (isOAuthFlow && step1Data.password === 'oauth-user-no-password') {
      // OAuth users are already pre-verified, proceed to profile completion or final signup
      if (step1Data.userType === 'project_owner') {
        // Project owners go straight to final signup
        handleCompleteSignup({ ...signupData, ...step1Data });
      } else {
        // Investors proceed to profile completion
        setCurrentStep('profile');
      }
      return;
    }

    // Call initial signup endpoint to create user and send OTP (for regular signup)
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/initial-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: step1Data.fullName,
          email: step1Data.email,
          password: step1Data.password,
          userType: step1Data.userType,
          company: step1Data.company,
          phone: step1Data.phone,
          websiteUrl: step1Data.websiteUrl,
          agreeToTerms: step1Data.agreeToTerms,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      await response.json();

      // Proceed to OTP verification step
      setCurrentStep('otp');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = () => {
    // OTP verified, proceed to profile completion or final signup
    if (signupData.userType === 'project_owner') {
      // Project owners go straight to final signup
      handleCompleteSignup(signupData);
    } else {
      // Investors proceed to profile completion
      setCurrentStep('profile');
    }
  };

  const handleProfileComplete = (profileData: InvestorProfileData) => {
    const combinedData = { ...signupData, ...profileData };
    setSignupData(combinedData);
    handleCompleteSignup(combinedData);
  };

  const handleCompleteSignup = async (finalData: CombinedSignupData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/enhanced-signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: finalData.fullName,
          email: finalData.email,
          password: finalData.password,
          userType: finalData.userType,
          company: finalData.company,
          location: finalData.location,
          bio: finalData.bio,
          linkedinUrl: finalData.linkedinUrl,
          websiteUrl: finalData.websiteUrl,
          phone: finalData.phone,
          investmentRange: finalData.investmentRange,
          portfolioSize: finalData.portfolioSize,
          investmentCategories: finalData.investmentCategories,
          experienceLevel: finalData.experienceLevel,
          investmentFocus: finalData.investmentFocus,
          accreditedInvestor: finalData.accreditedInvestor,
          marketingConsent: finalData.agreeToMarketing,
          enhancedSignup: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      await response.json();

      // Move to waiting screen
      setCurrentStep('waiting');

      if (onSuccess) {
        onSuccess();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setCurrentStep('step1');
  };

  const handleBackToOTP = () => {
    setCurrentStep('otp');
  };

  const handleContactSupport = () => {
    // Open email client or support page
    window.location.href = 'mailto:support@zuvomo.com?subject=Account Approval Inquiry';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Creating Your Account</h3>
          <p className="text-gray-600">Please wait while we set up your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Failed</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setCurrentStep('step1');
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy to-brand-blue p-4">
       <a
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors text-sm font-medium"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 18-6-6 6-6"/>
        </svg>
        Back to Home
      </a>
      {currentStep === 'step1' && (
        <EnhancedSignupFormStep1
          onNext={handleStep1Complete}
          initialData={signupData}
        />
      )}

      {currentStep === 'otp' && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <OTPVerification
              email={signupData.email}
              type="email_verification"
              onSuccess={handleOTPVerified}
              onBack={handleBackToStep1}
              title="Verify your email"
              description="We sent a 6-digit verification code to your email address. Please enter it below to continue."
            />
          </div>
        </div>
      )}

      {currentStep === 'profile' && (
        <InvestorProfileCompletion
          onNext={handleProfileComplete}
          onBack={handleBackToOTP}
          initialData={signupData}
        />
      )}

      {currentStep === 'waiting' && (
        <WaitingListScreen
          userType={signupData.userType as 'investor' | 'project_owner'}
          userName={signupData.fullName}
          userEmail={signupData.email}
          onContactSupport={handleContactSupport}
        />
      )}
    </div>
  );
};

export default ModularSignupForm;