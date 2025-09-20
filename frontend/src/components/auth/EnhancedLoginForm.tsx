import React, { useState,useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Smartphone, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import authEnhancedService, { AuthDetectionResult, EnhancedLoginRequest } from '../../services/authEnhanced';
import PendingApprovalScreen from './PendingApprovalScreen';
import RejectionScreen from './RejectionScreen';
import { WaitingListScreen } from './WaitingListScreen';
import InvestorProfileCompletion from './InvestorProfileCompletion';
import OTPVerification from './OTPVerification';
import ForgotPassword from './ForgotPassword';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedLoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onLayoutChange?: (needsWideLayout: boolean) => void;
}

export const EnhancedLoginForm: React.FC<EnhancedLoginFormProps> = ({
  onSuccess,
  onSwitchToSignup,
  onLayoutChange
}) => {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'email' | 'auth' | 'otp' | 'pending' | 'rejected' | 'verify' | 'complete_profile' | 'forgot_password'>('email');
  const [formData, setFormData] = useState<EnhancedLoginRequest>({
    email: '',
    password: '',
    otpCode: '',
    loginMethod: 'password'
  });

  const [authDetection, setAuthDetection] = useState<AuthDetectionResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  console.log("stepstepstepstepstep",step)

  // Notify parent about layout changes when step changes to wide form steps
  useEffect(() => {
    if (onLayoutChange) {
      const needsWideLayout = step === 'rejected' || step === 'pending';
      onLayoutChange(needsWideLayout);
    }
  }, [step, onLayoutChange]);

  // Handle OAuth user data and URL parameters for pre-population
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const statusParam = urlParams.get('status');
    const isOAuth = urlParams.get('oauth') === 'true';

    // Check for OAuth user data in sessionStorage
    const oauthUserDataString = sessionStorage.getItem('oauth_user_data');
    let oauthUserData = null;

    if (oauthUserDataString) {
      try {
        oauthUserData = JSON.parse(oauthUserDataString);
      } catch (error) {
        console.error('Failed to parse OAuth user data:', error);
        sessionStorage.removeItem('oauth_user_data');
      }
    }

    // Pre-populate email from URL parameter or OAuth data
    if (emailParam && !formData.email) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    } else if (oauthUserData?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: oauthUserData.email }));
    }

    // Handle OAuth callback status redirects
    if (statusParam && (isOAuth || oauthUserData)) {
      if (oauthUserData) {
        setUserInfo(oauthUserData);

        // Set appropriate step based on OAuth status
        switch (statusParam) {
          case 'pending':
            setStep('pending');
            break;
          case 'rejected':
            setStep('rejected');
            break;
          case 'profile_incomplete':
            setStep('complete_profile');
            break;
          default:
            // For unknown status, try email detection
            if (oauthUserData.email) {
              setFormData(prev => ({ ...prev, email: oauthUserData.email }));
            }
            break;
        }
      }
    }
  }, [formData.email]);
  // Detect authentication methods when email is entered
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authEnhancedService.detectAuthMethods(formData.email);

      if (response.data) {
        // Handle the response structure - backend returns {success, data: {...}}
        // The actual detection data is nested in response.data.data
        const detectionData = (response.data as any).data || response.data;
        console.log("Detection response:", response.data);
        console.log("Detection data:", detectionData);
        console.log("User role:", detectionData.user?.role);
        console.log("Methods available:", detectionData.methods);
        console.log("Next step:", detectionData.nextStep);

        // Ensure we're setting the correct data structure
        setAuthDetection(detectionData);

        if (!detectionData.exists) {
          setError(detectionData.message);
          setStep('email');

          // Show helpful toast for new users with OAuth guidance
          toast({
            variant: "destructive",
            title: "Email Not Found",
            description: "This email isn't registered yet. You can create an account using Google/LinkedIn login below or visit the signup page.",
          });
        } else {
          setUserInfo(detectionData.user);

          // Handle different user states based on the backend response
          // Priority 1: Admin users get direct access to authentication
          if (detectionData.user?.role === 'admin') {
            console.log("Admin user detected, proceeding to auth step");
            // Default admin users to password authentication
            if (detectionData.methods.includes('password')) {
              setFormData(prev => ({ ...prev, loginMethod: 'password' }));
            }
            setStep('auth');
            setSuccess(null);

            // Welcome toast for admin
            toast({
              title: "Welcome Back, Admin!",
              description: "Please enter your password to continue.",
            });
          }
          // Priority 2: Check nextStep for all other users
          else if (detectionData.nextStep === 'verify_email') {
            console.log("User needs email verification");
            setStep('verify');

            // Handle automatic OTP sending for unverified users
            if (detectionData.otpSent) {
              setSuccess(detectionData.otpMessage || 'A verification code has been sent to your email address.');
              setError(null);
            } else {
              setError(detectionData.message);
            }
          } else if (detectionData.nextStep === 'pending_approval') {
            console.log("User has pending approval");
            setStep('pending');

            toast({
              title: "Account Pending",
              description: "Your account is awaiting admin approval. You'll be notified once approved.",
            });
          } else if (detectionData.nextStep === 'rejected') {
            console.log("User was rejected");
            setStep('rejected');

            toast({
              title: "Account Requires Update",
              description: "Please update your information and resubmit your application.",
            });
          } else if (detectionData.nextStep === 'complete_profile') {
            console.log("User needs to complete profile");
            // Redirect to profile completion
            window.location.href = '/signup'; // You can customize this route

            toast({
              title: "Profile Incomplete",
              description: "Redirecting to complete your profile setup...",
            });
          } else if (detectionData.nextStep === 'authenticate') {
            console.log("Regular user ready to authenticate");
            // Regular verified and approved users
            setStep('auth');
            setSuccess(null);

            toast({
              title: "Welcome Back!",
              description: "Please choose your authentication method.",
            });
          } else {
            console.log("Unknown state, defaulting to auth");
            setStep('auth');
            setSuccess(null);
          }
        }
      } else {
        const errorMessage = response.error || 'Failed to detect authentication methods';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle authentication (password or OTP)
  // Helper function to handle user approval status consistently
  const handleUserApprovalStatus = async (user: any, loginMethod: string) => {
    console.log(`${loginMethod} Login - User role:`, user.role);
    console.log(`${loginMethod} Login - User approval status:`, user.approval_status);

    // For admin users, skip approval checks and go directly to redirection
    if (user.role === 'admin') {
      console.log(`${loginMethod} Login: Admin user - bypassing approval checks and redirecting directly`);
      setTimeout(() => {
        console.log(`${loginMethod} Login: Redirecting admin to dashboard`);
        window.location.href = '/admin';
      }, 100);
      return;
    }

    // For non-admin users, check approval status
    if (user.role !== 'admin') {
      console.log(`${loginMethod} Login: Non-admin user - checking approval status`);

      if (user.approval_status === 'pending') {
        console.log(`${loginMethod} Login: User approval pending - fetching full profile and showing pending screen`);

        // Fetch complete user profile using token-based API call
        const profileResponse = await authEnhancedService.getCurrentUser();
        const fullUserInfo = profileResponse.data?.user || user;

        setUserInfo(fullUserInfo);
        setStep('pending');
        return;
      } else if (user.approval_status === 'rejected') {
        console.log(`${loginMethod} Login: User was rejected - fetching full profile and showing rejection screen`);

        // Fetch complete user profile using token-based API call
        const profileResponse = await authEnhancedService.getCurrentUser();
        const fullUserInfo = profileResponse.data?.user || user;

        setUserInfo(fullUserInfo);
        setStep('rejected');
        return;
      } else if (user.approval_status !== 'approved') {
        console.log(`${loginMethod} Login: User approval status unknown:`, user.approval_status);
        setError('Your account status is unclear. Please contact support.');
        return;
      }
      // If approved, continue with normal redirection
      console.log(`${loginMethod} Login: User is approved - proceeding with redirection`);
    }

    // Handle role-based redirection for approved users
    setTimeout(() => {
      if (user.role === 'admin') {
        console.log(`${loginMethod} Login: Redirecting to admin dashboard`);
        window.location.href = '/admin';
      } else if (user.role === 'project_owner') {
        console.log(`${loginMethod} Login: Redirecting to project owner dashboard`);
        window.location.href = '/project-owner';
      } else if (user.role === 'investor') {
        console.log(`${loginMethod} Login: Redirecting to investor dashboard`);
        window.location.href = '/investor';
      } else {
        onSuccess?.();
      }
    }, 100);
  };
 


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (formData.loginMethod === 'password') {
        if (!formData.password) {
          setError('Please enter your password');
          setIsLoading(false);
          return;
        }

        // Use enhanced auth service for login
        console.log('Attempting login with:', { email: formData.email, password: '***' });

        const loginResponse = await authEnhancedService.login({
          email: formData.email,
          password: formData.password,
          loginMethod: 'password'
        });

        console.log('Login response:', loginResponse);

        // Check if response has nested data structure
        const loginData = loginResponse.data?.data || loginResponse.data;

        if (loginData && loginData.user) {
          // Check if email verification is required
          if (loginData.requiresVerification) {
            console.log('User needs email verification, OTP sent');
            setUserInfo(loginData.user);
            setStep('verify');
            setSuccess('Verification code sent to your email');
            return;
          }

          // Check if profile completion is required (for investors)
          if (loginData.nextStep === 'complete_profile') {
            console.log('Investor needs to complete profile');
            setUserInfo(loginData.user);

            // Store tokens
            if (loginData.accessToken) {
              localStorage.setItem('zuvomo_access_token', loginData.accessToken);
            }
            if (loginData.refreshToken) {
              localStorage.setItem('zuvomo_refresh_token', loginData.refreshToken);
            }
            localStorage.setItem('zuvomo_user', JSON.stringify(loginData.user));

            setStep('complete_profile');
            return;
          }

          setSuccess('Login successful!');

          // Show success toast
          toast({
            title: "Login Successful!",
            description: "Welcome back! Redirecting to your dashboard...",
          });

          // Store authentication tokens and user data
          if (loginData.accessToken) {
            localStorage.setItem('zuvomo_access_token', loginData.accessToken);
          }
          if (loginData.refreshToken) {
            localStorage.setItem('zuvomo_refresh_token', loginData.refreshToken);
          }
          localStorage.setItem('zuvomo_user', JSON.stringify(loginData.user));

          // Notify AuthContext about the successful login
          console.log('Refreshing AuthContext user data');
          await refreshUser();

          // Use unified approval status handling
          await handleUserApprovalStatus(loginData.user, 'Password');
          return;
        } else {
          // Handle specific error cases from backend
          if (loginData.error === 'ACCOUNT_REJECTED') {
            console.log('Backend returned ACCOUNT_REJECTED - fetching full profile and navigating to rejection screen');

            // Store temporary tokens to access API
            if (loginData.accessToken) {
              localStorage.setItem('zuvomo_access_token', loginData.accessToken);
            }

            // Fetch complete user profile
            const profileResponse = await authEnhancedService.getCurrentUser();
            
            const fullUserInfo = {...profileResponse?.data?.data?.user, ...{role: loginData.userType}} || {
              ...loginData,
              role: loginData.userType,
              email: formData.email
            };
            
            console.log("fullUserInfo", fullUserInfo);

            setUserInfo(fullUserInfo);
            setStep('rejected');
            return;
          } else if (loginData.error === 'ACCOUNT_PENDING') {
            console.log('Backend returned ACCOUNT_PENDING - fetching full profile and navigating to pending screen');

            // Store temporary tokens to access API
            if (loginData.accessToken) {
              localStorage.setItem('zuvomo_access_token', loginData.accessToken);
            }

            // Fetch complete user profile
            const profileResponse = await authEnhancedService.getCurrentUser();
            const fullUserInfo = profileResponse.data?.user || {
              ...loginData,
              role: loginData.userType,
              email: formData.email
            };

            setUserInfo(fullUserInfo);
            setStep('pending');
            return;
          } else if (loginData.error?.includes('EMAIL_NOT_VERIFIED')) {
            const errorMessage = 'Please verify your email address first';
            setError(errorMessage);
            toast({
              variant: "destructive",
              title: "Email Verification Required",
              description: "Please check your email and verify your account before logging in.",
            });
          } else {
            const errorMessage = loginData.error || loginData.message || 'Login failed';
            setError(errorMessage);
            toast({
              variant: "destructive",
              title: "Login Failed",
              description: errorMessage.includes('Invalid password')
                ? "Incorrect password. Please try again or use 'Forgot Password'."
                : errorMessage,
            });
          }
        }
      } else if (formData.loginMethod === 'otp') {
        if (step === 'auth' && !otpSent) {
          // Request OTP
          const response = await authEnhancedService.requestLoginOTP(formData.email);

          if (response.data) {
            setOtpSent(true);
            setStep('otp');
            setSuccess('Login code sent to your email');

            // Show toast for OTP sent
            toast({
              title: "Code Sent!",
              description: "Please check your email for the 6-digit login code.",
            });
          } else {
            const errorMessage = response.error || 'Failed to send login code';
            setError(errorMessage);
            toast({
              variant: "destructive",
              title: "Code Sending Failed",
              description: errorMessage,
            });
          }
        } else if (step === 'otp') {

          // Verify OTP
          if (!formData.otpCode) {
            setError('Please enter the 6-digit code');
            setIsLoading(false);
            return;
          }

          const result = await authEnhancedService.login({
            email: formData.email,
            otpCode: formData.otpCode,
            loginMethod: 'otp'
          });
          let response = result.data;
          console.log("OTP verification response:", response);

          if (response && response.user) {
            const userData = response;
            console.log('OTP Login: User data received', userData);

            // Check if email verification is required
            if (userData.requiresVerification) {
              console.log('OTP Login: User needs email verification, OTP sent');
              setUserInfo(userData.user);
              setStep('verify');
              setSuccess('Verification code sent to your email');
              return;
            }

            // Check if profile completion is required (for investors)
            if (userData.nextStep === 'complete_profile') {
              console.log('OTP Login: Investor needs to complete profile');
              setUserInfo(userData.user);

              // Store tokens
              if (userData.accessToken) {
                localStorage.setItem('zuvomo_access_token', userData.accessToken);
              }
              if (userData.refreshToken) {
                localStorage.setItem('zuvomo_refresh_token', userData.refreshToken);
              }
              localStorage.setItem('zuvomo_user', JSON.stringify(userData.user));

              setStep('complete_profile');
              return;
            }

            // Check user approval status
            if (userData.user.approval_status === 'rejected') {
              console.log('OTP Login: User is rejected - redirecting to rejection screen');

              // Store tokens for API access
              if (userData.accessToken) {
                localStorage.setItem('zuvomo_access_token', userData.accessToken);
              }
              if (userData.refreshToken) {
                localStorage.setItem('zuvomo_refresh_token', userData.refreshToken);
              }
              await refreshUser();
              setUserInfo(userData.user);
              setStep('rejected');
              return;
            } else if (userData.user.approval_status === 'pending') {
              console.log('OTP Login: User is pending approval - redirecting to pending screen');

              // Store tokens for API access
              if (userData.accessToken) {
                localStorage.setItem('zuvomo_access_token', userData.accessToken);
              }
              if (userData.refreshToken) {
                localStorage.setItem('zuvomo_refresh_token', userData.refreshToken);
              }
              await refreshUser();
              setUserInfo(userData.user);
              setStep('pending');
              return;
            } else if (userData.user.approval_status === 'approved') {
              setSuccess('Login successful!');

              // Show success toast for OTP login
              toast({
                title: "OTP Login Successful!",
                description: "Welcome back! Redirecting to your dashboard...",
              });

              // Store authentication tokens and user data for OTP login
              if (userData.accessToken) {
                localStorage.setItem('zuvomo_access_token', userData.accessToken);
              }
              if (userData.refreshToken) {
                localStorage.setItem('zuvomo_refresh_token', userData.refreshToken);
              }
              localStorage.setItem('zuvomo_user', JSON.stringify(userData.user));

              // Notify AuthContext about the successful login
              console.log('OTP Login: Refreshing AuthContext user data');
              await refreshUser();

              // Use unified approval status handling
              await handleUserApprovalStatus(userData.user, 'OTP');
              return;
            } else {
              console.log('OTP Login: Unknown approval status:', userData.user.approval_status);
              setError('Unknown account status. Please contact support.');
            }
          } else {
            setError(response.error || 'Invalid or expired code');
          }
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Show toast for OAuth initiation
      toast({
        title: "Redirecting to Google",
        description: "You'll be redirected to Google's secure login page...",
      });

      // Generate redirect URI for login flow
      const redirectUri = `http://localhost:3001/api/auth-enhanced/oauth/google/callback`;

      const response = await authEnhancedService.getOAuthURL('google', redirectUri);

      if (response.data && response.data.data && response.data.data.authUrl) {
        // Clear any previous OAuth session data
        sessionStorage.removeItem('oauth_signup_intent');
        sessionStorage.setItem('oauth_provider', 'google');

        // Redirect to Google OAuth
        window.location.href = response.data.data.authUrl;
      } else {
        console.error('Google OAuth error:', response.error);
        const errorMessage = response.errorCode === 'GOOGLE_CONFIG_MISSING'
          ? 'Google login is temporarily unavailable. Please try password login or contact support.'
          : response.error || 'Failed to initialize Google authentication';

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Google Login Error",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('Google OAuth initiation error:', error);
      const errorMessage = 'Failed to initialize Google authentication';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle LinkedIn OAuth
  const handleLinkedInAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Show toast for OAuth initiation
      toast({
        title: "Redirecting to LinkedIn",
        description: "You'll be redirected to LinkedIn's secure login page...",
      });

      // Generate redirect URI for login flow
      const redirectUri = `http://localhost:3001/api/auth-enhanced/oauth/linkedin/callback`;

      const response = await authEnhancedService.getOAuthURL('linkedin', redirectUri);

      if (response.data && response.data.data && response.data.data.authUrl) {
        // Clear any previous OAuth session data
        sessionStorage.removeItem('oauth_signup_intent');
        sessionStorage.setItem('oauth_provider', 'linkedin');

        // Redirect to LinkedIn OAuth
        window.location.href = response.data.data.authUrl;
      } else {
        console.error('LinkedIn OAuth error:', response.error);
        const errorMessage = response.errorCode === 'LINKEDIN_CONFIG_MISSING'
          ? 'LinkedIn login is temporarily unavailable. Please try password login or contact support.'
          : response.error || 'Failed to initialize LinkedIn authentication';

        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "LinkedIn Login Error",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error('LinkedIn OAuth initiation error:', error);
      const errorMessage = 'Failed to initialize LinkedIn authentication';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);

    try {
      const response = await authEnhancedService.resendOTP(formData.email, 'login');

      if (response.data) {
        setSuccess('New login code sent to your email');
        setError(null);
      } else {
        const errorMessage = response.error || 'Failed to resend code';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Resend Failed",
          description: errorMessage,
        });
      }
    } catch (error) {
      const errorMessage = 'Failed to resend code';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
  const handleBack = () => {
    if (step === 'otp') {
      setStep('auth');
      setOtpSent(false);
    } else if (step === 'auth') {
      setStep('email');
      setAuthDetection(null);
    }
    setError(null);
    setSuccess(null);
  };

  // Render email input step
  const renderEmailStep = () => (
    <div className="space-y-6">
      {/* Email Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email address"
              disabled={isLoading}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !formData.email}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToSignup}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign up
            </button>
          </p>
        </div>
      </form>

      {/* Social Login Options - Show below email form */}
      <div className="space-y-4">
        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#0A66C2" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Continue with LinkedIn
          </button>
        </div>
      </div>
    </div>
  );

  // Render authentication method selection and input
  const renderAuthStep = () => {
    if (!authDetection) return null;

    const hasPassword = authDetection.methods.includes('password');
    const hasSocial = authDetection.socialProviders.length > 0;
    const isAdmin = userInfo?.role === 'admin';

    return (
      <div className="space-y-4">
        {/* User greeting and message */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 font-medium">{authDetection.message}</p>
          {isAdmin && (
            <p className="text-blue-600 text-sm mt-1">Administrator Access</p>
          )}
        </div>

        {/* Authentication methods */}
        {hasPassword && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="loginMethod"
                  value="password"
                  checked={formData.loginMethod === 'password'}
                  onChange={(e) => setFormData(prev => ({ ...prev, loginMethod: e.target.value as 'password' | 'otp' }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium">
                  Password {isAdmin && <span className="text-blue-600">(Recommended)</span>}
                </span>
              </label>
            </div>

            {formData.loginMethod === 'password' && (
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setStep('forgot_password')}
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* OTP option */}
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="loginMethod"
              value="otp"
              checked={formData.loginMethod === 'otp'}
              onChange={(e) => setFormData(prev => ({ ...prev, loginMethod: e.target.value as 'password' | 'otp' }))}
              className="mr-2"
            />
            <span className="text-sm font-medium">Email verification code</span>
          </label>
        </div>

        {/* Social login options */}
        {hasSocial && (
          <div className="space-y-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="space-y-2">
              {authDetection.socialProviders.includes('google') && (
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
              )}

              {authDetection.socialProviders.includes('linkedin') && (
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
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleAuth}>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              formData.loginMethod === 'otp' ? 'Send Login Code' : 'Sign In'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={handleBack}
          className="w-full text-gray-600 hover:text-gray-800 py-2"
        >
          ← Back to email
        </button>
      </div>
    );
  };

  // Render OTP verification step
  const renderOTPStep = () => (
    <div className="space-y-4">
      <div className="text-center p-4 bg-blue-50 rounded-lg">
        <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <p className="text-blue-800 font-medium">Check your email</p>
        <p className="text-blue-600 text-sm mt-1">
          We sent a 6-digit code to {formData.email}
        </p>
      </div>

      <form onSubmit={handleAuth}>
        <div>
          <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            id="otpCode"
            type="text"
            value={formData.otpCode}
            onChange={(e) => setFormData(prev => ({ ...prev, otpCode: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest"
            placeholder="000000"
            maxLength={6}
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || formData.otpCode.length !== 6}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Verify & Sign In'
          )}
        </button>
      </form>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
        >
          Resend code
        </button>

        <button
          type="button"
          onClick={handleBack}
          className="block w-full text-gray-600 hover:text-gray-800 py-2"
        >
          ← Back to login options
        </button>
      </div>
    </div>
  );

  // Handle logout for status screens
  const handleLogout = () => {
    authEnhancedService.clearAuth();
    setStep('email');
    setUserInfo(null);
    setAuthDetection(null);
    setFormData({ email: '', password: '', otpCode: '', loginMethod: 'password' });
  };

  // Show Waiting List Screen
  if (step === 'pending') {
    return (
      <WaitingListScreen
        userType={userInfo?.role as 'investor' | 'project_owner'}
        userName={`${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`.trim() || 'User'}
        userEmail={userInfo?.email || ''}
        onContactSupport={() => {
          window.open('mailto:support@zuvomo.com', '_blank');
        }}
      />
    );
  }

  // Show Rejection Screen
  if (step === 'rejected') {
    return (
      <RejectionScreen
        userEmail={userInfo?.email}
        userRole={userInfo?.role as 'investor' | 'project_owner'}
        userData={userInfo}
        rejectionReason="Your application was rejected. Please update your information and resubmit."
        onBackToLogin={handleLogout}
        onResubmissionSuccess={() => {
          setStep('pending');
          setSuccess('Application resubmitted successfully! We will review it again.');

          // Show success toast for resubmission
          toast({
            title: "Application Resubmitted!",
            description: "Your updated application has been submitted for review.",
          });
        }}
      />
    );
  }

  // Show Email Verification Screen
  if (step === 'verify') {
    return (
      <OTPVerification
        email={userInfo?.email || formData.email}
        type="email_verification"
        onSuccess={async () => {
          // After successful verification, check if investor needs to complete profile
          const user = userInfo || JSON.parse(localStorage.getItem('zuvomo_user') || '{}');

          if (user.role === 'investor' || user.user_type === 'investor') {
            // Check if investor has completed profile
            const profileResponse = await authEnhancedService.getCurrentUser();
            const currentUser = profileResponse.data?.user;

            if (currentUser && !currentUser.investment_range && !currentUser.investment_categories) {
              setUserInfo(currentUser);
              setStep('complete_profile');
              return;
            }
          }

          // Otherwise, check approval status
          if (user.approval_status === 'pending') {
            setStep('pending');
          } else if (user.approval_status === 'approved') {
            await handleUserApprovalStatus(user, 'Login');
          }
        }}
        onBack={() => setStep('email')}
        title="Verify Your Email"
        description="We've sent a verification code to your email address"
      />
    );
  }

  // Show Profile Completion Screen (for investors only)
  if (step === 'complete_profile') {
    return (
      <InvestorProfileCompletion
        onNext={async (profileData) => {
          // Save profile data to backend
          console.log('Profile data to save:', profileData);
          // After profile completion, go to pending approval
          setStep('pending');
          setSuccess('Profile completed successfully! Your application is now pending approval.');
        }}
        onBack={() => {
          // Go back to email step
          setStep('email');
        }}
        initialData={{
          linkedinUrl: userInfo?.linkedin_url || '',
          investmentRange: userInfo?.investment_range || '',
          portfolioSize: userInfo?.current_portfolio_size || '',
          investmentCategories: userInfo?.investment_categories || []
        }}
      />
    );
  }

  // Show Forgot Password Screen
  if (step === 'forgot_password') {
    return (
      <ForgotPassword
        onBackToLogin={() => setStep('email')}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-gray-600">
          {step === 'email' && 'Enter your email to continue'}
          {step === 'auth' && 'Choose your sign-in method'}
          {step === 'otp' && 'Enter verification code'}
        </p>
      </div>

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

      {/* Render appropriate step */}
      {step === 'email' && renderEmailStep()}
      {step === 'auth' && renderAuthStep()}
      {step === 'otp' && renderOTPStep()}
    </div>
  );
};

export default EnhancedLoginForm;