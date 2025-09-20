import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Globe, Linkedin, Building, AlertTriangle, RefreshCw, CheckCircle, Edit, XCircle } from 'lucide-react';
import { InvestmentRangeSlider } from './InvestmentRangeSlider';
import { PortfolioSizeSelector } from './PortfolioSizeSelector';
import { CategorySelector } from './CategorySelector';
import authEnhancedService, { EnhancedSignupRequest } from '../../services/authEnhanced';

interface RejectionScreenProps {
  userEmail?: string;
  userRole?: 'investor' | 'project_owner';
  rejectionReason?: string;
  userData?: any;
  onBackToLogin?: () => void;
  onResubmissionSuccess?: () => void;
}

export interface BaseProfileData {
  user_type: 'investor' | 'project_owner';
  location: string;
  phone: string;
  website_url: string;
  linkedin_url: string;
  bio: string;
}

export interface InvestorProfileData extends BaseProfileData {
  investment_range: string;
  current_portfolio_size: string;
  investment_categories: string[];
  accredited_investor: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  investment_focus: string[];
}

export interface ProjectOwnerProfileData extends BaseProfileData {
  // Project owners only need the base fields
}

const experienceLevels = [
  { value: 'beginner', label: 'Beginner', description: 'New to investing' },
  { value: 'intermediate', label: 'Intermediate', description: '1-3 years experience' },
  { value: 'experienced', label: 'Experienced', description: '3-7 years experience' },
  { value: 'expert', label: 'Expert', description: '7+ years experience' },
];

const investmentFocusOptions = [
  'Early Stage (Pre-Seed, Seed)',
  'Growth Stage (Series A, B)',
  'Late Stage (Series C+)',
  'Strategic Investments',
  'Acquisition Opportunities',
  'Follow-on Investments',
];

export const RejectionScreen: React.FC<RejectionScreenProps> = ({
  userEmail = '',
  userRole = 'investor',
  rejectionReason = '',
  userData = {},
  onBackToLogin,
  onResubmissionSuccess
}) => {
  const [showResubmissionForm, setShowResubmissionForm] = useState(false);
  console.log("userDatauserData",userData)
 
  const [formData, setFormData] = useState<InvestorProfileData | ProjectOwnerProfileData>({
    user_type: userData?.user_type || userRole,
    location: userData?.location || '',
    phone: userData?.phone || '',
    website_url: userData?.website_url || '',
    linkedin_url: userData?.linkedin_url || '',
    bio: userData?.bio || '',
    investment_focus:[],
    // Investor-specific fields (only for investors)
    ...(userRole === 'investor' && {
      investment_range: userData?.investment_range || '',
      current_portfolio_size: userData?.current_portfolio_size || '',
      investment_categories: userData?.investment_categories || [],
      accredited_investor: userData?.accredited_investor || false,
      experienceLevel: userData?.experience_level || 'intermediate',
      // investment_focus: userData?.investment_focus
      //   ? (typeof userData.investment_focus === 'string' ? JSON.parse(userData?.investment_focus) : userData?.investment_focus)
      //   : [],
    })
  });
 console.log("formData",formData)
  const [errors, setErrors] = useState<Partial<InvestorProfileData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const roleLabel = userRole === 'investor' ? 'Investor' : 'Project Owner';

  const validateForm = (): boolean => {
    const newErrors: Partial<InvestorProfileData> = {};

    // Common validations for all user types
    if (!formData?.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData?.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData?.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (formData.linkedin_url && !isValidUrl(formData.linkedin_url)) {
      newErrors.linkedin_url = 'Please enter a valid LinkedIn URL';
    }

    if (formData.website_url && !isValidUrl(formData.website_url)) {
      newErrors.website_url = 'Please enter a valid website URL';
    }

    // Investor-specific validations
    if (userRole === 'investor') {
      const investorData = formData as InvestorProfileData;

      if (!investorData.investment_range) {
        newErrors.investment_range = 'Investment range is required';
      }

      if (!investorData.current_portfolio_size) {
        newErrors.current_portfolio_size = 'Portfolio size is required';
      }

      if (!investorData.investment_categories || investorData.investment_categories.length === 0) {
        newErrors.investment_categories = 'Please select at least one investment category';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      const enhancedData: EnhancedSignupRequest = {
        email: userData?.email || userEmail,
        password: '',
        first_name: userData?.first_name || '',
        last_name: userData?.last_name || '',
        user_type: userData?.user_type || userRole,
        location: formData?.location,
        phone: formData?.phone || '',
        website_url: formData?.website_url,
        linkedin_url: formData?.linkedin_url,
        bio: formData?.bio,
        // Include investor-specific fields only for investors
        ...(userRole === 'investor' && {
          investment_focus: (formData as InvestorProfileData).investment_focus?.join(',') || '',
          investment_range: (formData as InvestorProfileData).investment_range || '',
          investment_categories: (formData as InvestorProfileData).investment_categories || [],
          accredited_investor: (formData as InvestorProfileData).accredited_investor || false
        })
      };

      const response = await authEnhancedService.resubmitApplication(enhancedData);

      if (response.data) {
        setSuccess('Application resubmitted successfully! We will review it again.');
        setTimeout(() => {
          onResubmissionSuccess?.();
        }, 2000);
      } else {
        setError(response.error || 'Resubmission failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field as keyof InvestorProfileData]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleFocusToggle = (focus: string) => {
    if (userRole === 'investor') {
      setFormData(prev => {
        const investorPrev = prev as InvestorProfileData;
        return {
          ...prev,
          investment_focus: investorPrev.investment_focus?.includes(focus)
            ? investorPrev.investment_focus.filter(f => f !== focus)
            : [...(investorPrev.investment_focus || []), focus]
        };
      });
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (userRole === 'investor') {
      setFormData(prev => {
        const investorPrev = prev as InvestorProfileData;
        return {
          ...prev,
          investment_categories: investorPrev.investment_categories?.includes(category)
            ? investorPrev.investment_categories.filter(c => c !== category)
            : [...(investorPrev.investment_categories || []), category]
        };
      });
    }
  };

  const canSubmit = userRole === 'investor'
    ? (formData as InvestorProfileData).investment_range &&
      (formData as InvestorProfileData).current_portfolio_size &&
      (formData as InvestorProfileData).investment_categories?.length > 0 &&
      formData.location &&
      formData.bio && formData.bio.length >= 50
    : formData.location && formData.bio && formData.bio.length >= 50;

  if (showResubmissionForm) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Update Your {roleLabel} Profile</h2>
          <p className="text-gray-600">Address the concerns and resubmit your application</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
            <div className="w-8 h-2 bg-red-500 rounded-full"></div>
            <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Step 2 of 3 - Profile Update</p>
        </div>

        {/* Rejection Reason Alert */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-semibold text-lg">Reason for Rejection</h3>
              <p className="text-red-700 text-sm mt-2">{rejectionReason}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Common Fields for All Users */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

            {/* Location and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4" />
                  <span>Location *</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.location ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., San Francisco, CA"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Social Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn URL</span>
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={handleInputChange('linkedin_url')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.linkedin_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                {errors.linkedin_url && <p className="text-red-500 text-sm mt-1">{errors.linkedin_url}</p>}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Building className="w-4 h-4" />
                  <span>Website URL</span>
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={handleInputChange('website_url')}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.website_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://yourcompany.com"
                />
                {errors.website_url && <p className="text-red-500 text-sm mt-1">{errors.website_url}</p>}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional Bio *
              </label>
              <textarea
                value={formData.bio}
                onChange={handleInputChange('bio')}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.bio ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={userRole === 'investor'
                  ? "Tell us about your investment background, expertise, and what you're looking for in investment opportunities..."
                  : "Tell us about your business background, experience, and the projects you're working on..."
                }
              />
              <div className="flex justify-between items-center mt-1">
                {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.bio.length}/500 characters (minimum 50)
                </p>
              </div>
            </div>
          </div>

          {/* Investor-Specific Fields */}
          {userRole === 'investor' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Investment Profile</h3>

              {/* Investment Range */}
              <div>
                <InvestmentRangeSlider
                  selectedRange={(formData as InvestorProfileData).investment_range}
                  onChange={(range) => {
                    setFormData(prev => ({ ...prev, investment_range: range }));
                    if (errors.investment_range) {
                      setErrors(prev => ({ ...prev, investment_range: undefined }));
                    }
                  }}
                />
                {errors.investment_range && (
                  <p className="text-red-500 text-sm mt-1">{errors.investment_range}</p>
                )}
              </div>

              {/* Portfolio Size */}
              <div>
                <PortfolioSizeSelector
                  selectedSize={(formData as InvestorProfileData).current_portfolio_size}
                  onChange={(size) => {
                    setFormData(prev => ({ ...prev, current_portfolio_size: size }));
                    if (errors.current_portfolio_size) {
                      setErrors(prev => ({ ...prev, current_portfolio_size: undefined }));
                    }
                  }}
                />
                {errors.current_portfolio_size && (
                  <p className="text-red-500 text-sm mt-1">{errors.current_portfolio_size}</p>
                )}
              </div>

              {/* Investment Categories */}
              <div>
                <CategorySelector
                  selectedCategories={(formData as InvestorProfileData).investment_categories || []}
                  onChange={(categories) => {
                    setFormData(prev => ({ ...prev, investment_categories: categories }));
                    if (errors.investment_categories) {
                      setErrors(prev => ({ ...prev, investment_categories: undefined }));
                    }
                  }}
                />
                {errors.investment_categories && (
                  <p className="text-red-500 text-sm mt-1">{errors.investment_categories}</p>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Investment Experience Level *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {experienceLevels.map((level) => (
                    <label
                      key={level.value}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        (formData as InvestorProfileData).experienceLevel === level.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="experienceLevel"
                        value={level.value}
                        checked={(formData as InvestorProfileData).experienceLevel === level.value}
                        onChange={handleInputChange('experienceLevel')}
                        className="sr-only"
                      />
                      <span className="font-medium text-sm">{level.label}</span>
                      <span className="text-xs text-center mt-1 text-gray-500">{level.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Investment Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Investment Focus (select all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {investmentFocusOptions.map((focus) => (
                    <label
                      key={focus}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        (formData as InvestorProfileData).investment_focus?.includes(focus)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(formData as InvestorProfileData).investment_focus?.includes(focus) || false}
                        onChange={() => handleFocusToggle(focus)}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">{focus}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Accredited Investor Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accredited Investor Status
                </label>
                <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={(formData as InvestorProfileData).accredited_investor || false}
                    onChange={handleInputChange('accredited_investor')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">I am an accredited investor</span>
                </label>
              </div>
            </div>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            <button
              type="button"
              onClick={() => setShowResubmissionForm(false)}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={!canSubmit || isLoading}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                canSubmit && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <span>Resubmit Application</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Initial rejection screen (unchanged from original)
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Application Rejected
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your {roleLabel.toLowerCase()} application needs some adjustments
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-red-800 font-medium">Reason for Rejection</h3>
                  <p className="text-red-700 text-sm mt-1">{rejectionReason}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">What you can do:</h3>

              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      <strong>Update your application</strong> - Address the concerns mentioned in the rejection reason
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100">
                      <span className="text-blue-600 text-sm font-medium">2</span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      <strong>Resubmit for review</strong> - Your updated application will be reviewed again
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">
                      <strong>Get approved</strong> - Once approved, you'll gain full access to the platform
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowResubmissionForm(true)}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Edit className="h-5 w-5 mr-2" />
                Update Application
              </button>

              {onBackToLogin && (
                <button
                  onClick={onBackToLogin}
                  className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Back to Login
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500 text-center">
                Need help? Contact us at{' '}
                <a href="mailto:support@zuvomo.com" className="text-blue-600 hover:text-blue-500">
                  support@zuvomo.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionScreen;