import React, { useState } from 'react';
import { User, Mail, Phone, Globe, Linkedin, FileText, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import authEnhancedService, { ProfileCompletionRequest } from '../../services/authEnhanced';
import { InvestmentRangeSlider } from './InvestmentRangeSlider';
import { CategorySelector } from './CategorySelector';

interface ProfileCompletionFormProps {
  userEmail: string;
  userType: 'investor' | 'project_owner';
  onSuccess?: () => void;
  onBack?: () => void;
}

export const ProfileCompletionForm: React.FC<ProfileCompletionFormProps> = ({
  userEmail,
  userType,
  onSuccess,
  onBack
}) => {
  const [formData, setFormData] = useState<ProfileCompletionRequest>({
    location: '',
    phone: '',
    website_url: '',
    linkedin_url: '',
    bio: '',
    // Investor-specific fields
    ...(userType === 'investor' && {
      investment_focus: '',
      investment_range: '',
      investment_categories: [],
      accredited_investor: false
    })
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof ProfileCompletionRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError(null);
  };

  const handleCategoryChange = (categories: string[]) => {
    setFormData(prev => ({
      ...prev,
      investment_categories: categories
    }));
  };

  const handleAccreditedChange = (accredited: boolean) => {
    setFormData(prev => ({
      ...prev,
      accredited_investor: accredited
    }));
  };

  const validateForm = (): boolean => {
    if (userType === 'investor') {
      if (!formData.investment_range) {
        setError('Investment range is required for investors');
        return false;
      }
      if (!formData.investment_categories || formData.investment_categories.length === 0) {
        setError('Please select at least one investment category');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setError(null);

    try {
      // For now, we'll just show success since we don't have a specific profile completion endpoint
      // In a real implementation, you would call a backend endpoint to save the profile data
      console.log('Profile completion data:', formData);

      setTimeout(() => {
        setIsLoading(false);
        onSuccess?.();
      }, 1000);
    } catch (error) {
      setError('Failed to complete profile. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
        <p className="text-gray-600">Step 2 of 2 - Profile Setup</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div className="bg-blue-600 h-2 rounded-full w-full"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information Section */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Mail className="w-6 h-6 mr-2 text-blue-600" />
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={userEmail}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={handleInputChange('location')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="City, Country"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={handleInputChange('phone')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Your phone number"
              />
            </div>

            {/* Website */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <Globe className="w-4 h-4" />
                <span>Website URL</span>
              </label>
              <input
                type="url"
                value={formData.website_url || ''}
                onChange={handleInputChange('website_url')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          {/* LinkedIn */}
          <div className="mt-6">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn Profile</span>
            </label>
            <input
              type="url"
              value={formData.linkedin_url || ''}
              onChange={handleInputChange('linkedin_url')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          {/* Bio */}
          <div className="mt-6">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Bio</span>
            </label>
            <textarea
              value={formData.bio || ''}
              onChange={handleInputChange('bio')}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Tell us about yourself and your background..."
            />
          </div>
        </div>

        {/* Investor-specific section */}
        {userType === 'investor' && (
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Investment Preferences</h3>

            <div className="space-y-6">
              {/* Investment Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Categories *
                </label>
                <CategorySelector
                  selectedCategories={formData.investment_categories || []}
                  onCategoriesChange={handleCategoryChange}
                />
              </div>

              {/* Investment Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Range *
                </label>
                <InvestmentRangeSlider
                  value={formData.investment_range || ''}
                  onChange={(value) => setFormData(prev => ({ ...prev, investment_range: value }))}
                />
              </div>

              {/* Investment Focus */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Focus Areas
                </label>
                <textarea
                  value={formData.investment_focus || ''}
                  onChange={handleInputChange('investment_focus')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Describe your investment focus and strategy..."
                />
              </div>

              {/* Accredited Investor */}
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.accredited_investor || false}
                    onChange={(e) => handleAccreditedChange(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    I am an accredited investor
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Accredited investors have access to additional investment opportunities
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-8 border-t">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Completing Profile...
              </>
            ) : (
              <>
                <span>Complete Profile</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileCompletionForm;