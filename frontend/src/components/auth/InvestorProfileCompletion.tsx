import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Globe, Linkedin, Building } from 'lucide-react';
import { InvestmentRangeSlider } from './InvestmentRangeSlider';
import { PortfolioSizeSelector } from './PortfolioSizeSelector';
import { CategorySelector } from './CategorySelector';

interface InvestorProfileCompletionProps {
  onNext: (data: InvestorProfileData) => void;
  onBack: () => void;
  initialData?: Partial<InvestorProfileData>;
}

export interface InvestorProfileData {
  investmentRange: string;
  portfolioSize: string;
  investmentCategories: string[];
  linkedinUrl: string;
  websiteUrl: string;
  bio: string;
  location: string;
  accreditedInvestor: boolean;
  experienceLevel: 'beginner' | 'intermediate' | 'experienced' | 'expert';
  investmentFocus: string[];
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

export const InvestorProfileCompletion: React.FC<InvestorProfileCompletionProps> = ({
  onNext,
  onBack,
  initialData = {}
}) => {
  const [formData, setFormData] = useState<InvestorProfileData>({
    investmentRange: initialData.investmentRange || '',
    portfolioSize: initialData.portfolioSize || '',
    investmentCategories: initialData.investmentCategories || [],
    linkedinUrl: initialData.linkedinUrl || '',
    websiteUrl: initialData.websiteUrl || '',
    bio: initialData.bio || '',
    location: initialData.location || '',
    accreditedInvestor: initialData.accreditedInvestor || false,
    experienceLevel: initialData.experienceLevel || 'intermediate',
    investmentFocus: initialData.investmentFocus || [],
  });

  const [errors, setErrors] = useState<Partial<InvestorProfileData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<InvestorProfileData> = {};

    if (!formData.investmentRange) {
      newErrors.investmentRange = 'Investment range is required';
    }

    if (!formData.portfolioSize) {
      newErrors.portfolioSize = 'Portfolio size is required';
    }

    if (formData.investmentCategories.length === 0) {
      newErrors.investmentCategories = 'Please select at least one investment category';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.bio.trim()) {
      newErrors.bio = 'Bio is required';
    } else if (formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }

    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid website URL';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(formData);
    }
  };

  const handleInputChange = (field: keyof InvestorProfileData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleFocusToggle = (focus: string) => {
    setFormData(prev => ({
      ...prev,
      investmentFocus: prev.investmentFocus.includes(focus)
        ? prev.investmentFocus.filter(f => f !== focus)
        : [...prev.investmentFocus, focus]
    }));
  };

  const canSubmit = formData.investmentRange && formData.portfolioSize &&
                   formData.investmentCategories.length > 0 && formData.location &&
                   formData.bio && formData.bio.length >= 50;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Investor Profile</h2>
        <p className="text-gray-600">Help us match you with the right investment opportunities</p>
        <div className="flex items-center justify-center mt-4 space-x-2">
          <div className="w-8 h-2 bg-green-500 rounded-full"></div>
          <div className="w-8 h-2 bg-blue-500 rounded-full"></div>
          <div className="w-8 h-2 bg-gray-200 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Step 2 of 3</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Investment Range */}
        <div>
          <InvestmentRangeSlider
            selectedRange={formData.investmentRange}
            onChange={(range) => {
              setFormData(prev => ({ ...prev, investmentRange: range }));
              if (errors.investmentRange) {
                setErrors(prev => ({ ...prev, investmentRange: undefined }));
              }
            }}
          />
          {errors.investmentRange && (
            <p className="text-red-500 text-sm mt-1">{errors.investmentRange}</p>
          )}
        </div>

        {/* Portfolio Size */}
        <div>
          <PortfolioSizeSelector
            selectedSize={formData.portfolioSize}
            onChange={(size) => {
              setFormData(prev => ({ ...prev, portfolioSize: size }));
              if (errors.portfolioSize) {
                setErrors(prev => ({ ...prev, portfolioSize: undefined }));
              }
            }}
          />
          {errors.portfolioSize && (
            <p className="text-red-500 text-sm mt-1">{errors.portfolioSize}</p>
          )}
        </div>

        {/* Investment Categories */}
        <div>
          <CategorySelector
            selectedCategories={formData.investmentCategories}
            onChange={(categories) => {
              setFormData(prev => ({ ...prev, investmentCategories: categories }));
              if (errors.investmentCategories) {
                setErrors(prev => ({ ...prev, investmentCategories: undefined }));
              }
            }}
          />
          {errors.investmentCategories && (
            <p className="text-red-500 text-sm mt-1">{errors.investmentCategories}</p>
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
                  formData.experienceLevel === level.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="experienceLevel"
                  value={level.value}
                  checked={formData.experienceLevel === level.value}
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
                  formData.investmentFocus.includes(focus)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.investmentFocus.includes(focus)}
                  onChange={() => handleFocusToggle(focus)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm">{focus}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Location and Bio */}
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
              Accredited Investor Status
            </label>
            <label className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={formData.accreditedInvestor}
                onChange={handleInputChange('accreditedInvestor')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">I am an accredited investor</span>
            </label>
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
            placeholder="Tell us about your investment background, expertise, and what you're looking for in investment opportunities..."
          />
          <div className="flex justify-between items-center mt-1">
            {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
            <p className="text-sm text-gray-500 ml-auto">
              {formData.bio.length}/500 characters (minimum 50)
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn URL (optional)</span>
            </label>
            <input
              type="url"
              value={formData.linkedinUrl}
              onChange={handleInputChange('linkedinUrl')}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://linkedin.com/in/yourprofile"
            />
            {errors.linkedinUrl && <p className="text-red-500 text-sm mt-1">{errors.linkedinUrl}</p>}
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Building className="w-4 h-4" />
              <span>Website URL (optional)</span>
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

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              canSubmit
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvestorProfileCompletion;