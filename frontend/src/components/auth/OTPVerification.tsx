import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
// Import a simple API client instead of authEnhanced since we use different endpoints

interface OTPVerificationProps {
  email: string;
  type: 'email_verification' | 'login';
  onSuccess: (data?: any) => void;
  onBack?: () => void;
  title?: string;
  description?: string;
}

export const OTPVerification: React.FC<OTPVerificationProps> = ({
  email,
  type,
  onSuccess,
  onBack,
  title,
  description
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle OTP input change
  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newOtpCode = otpCode.split('');
    newOtpCode[index] = value;
    const updatedOtpCode = newOtpCode.join('');

    setOtpCode(updatedOtpCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are entered
    if (updatedOtpCode.length === 6) {
      handleVerifyOTP(updatedOtpCode);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const pasteCode = paste.replace(/\D/g, '').slice(0, 6); // Only digits, max 6

    if (pasteCode.length === 6) {
      setOtpCode(pasteCode);
      handleVerifyOTP(pasteCode);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (code: string = otpCode) => {
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (type === 'email_verification') {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            otpCode: code
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSuccess('Email verified successfully!');
          setTimeout(() => onSuccess(result.data), 1500);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Invalid or expired verification code');
        }
      } else if (type === 'login') {
        // Login OTP would use different endpoint - not implemented yet
        setError('Login with OTP not implemented yet');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess('New verification code sent!');
        setCanResend(false);
        setResendCountdown(60);
        setOtpCode('');

        // Reset countdown
        const timer = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to resend verification code');
      }
    } catch (error) {
      setError('Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTitle = type === 'email_verification' ? 'Verify your email' : 'Enter login code';
  const defaultDescription = type === 'email_verification'
    ? 'We sent a 6-digit verification code to your email address'
    : 'We sent a 6-digit login code to your email address';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {type === 'email_verification' ? (
            <Mail className="h-12 w-12 text-blue-600" />
          ) : (
            <Smartphone className="h-12 w-12 text-blue-600" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-gray-900">
          {title || defaultTitle}
        </h2>
        <p className="mt-2 text-gray-600">
          {description || defaultDescription}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Sent to: <span className="font-medium">{email}</span>
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

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex justify-center space-x-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={otpCode[index] || ''}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-2xl font-bold text-center border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              disabled={isLoading}
            />
          ))}
        </div>

        {/* Verify Button */}
        <button
          onClick={() => handleVerifyOTP()}
          disabled={isLoading || otpCode.length !== 6}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            type === 'email_verification' ? 'Verify Email' : 'Sign In'
          )}
        </button>
      </div>

      {/* Resend Section */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          Didn't receive the code?
        </p>

        {canResend ? (
          <button
            onClick={handleResendOTP}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-500 font-medium text-sm"
          >
            Resend verification code
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Resend available in {resendCountdown}s
          </p>
        )}
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center text-gray-600 hover:text-gray-800 py-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
      )}

      {/* Help Text */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>Check your spam folder if you don't see the email</p>
        <p>The code expires in 10 minutes</p>
      </div>
    </div>
  );
};

export default OTPVerification;