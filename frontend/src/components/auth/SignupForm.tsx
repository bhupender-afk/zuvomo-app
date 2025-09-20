import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

const SignupForm: React.FC = () => {
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    telegram_handle: '',
    website_url: '',
    linkedin: '',
    user_type: 'investor' as 'project_owner' | 'investor',
    company: '',
    location: '',
    // Investor-specific fields
    investment_focus: '',
    preferred_category: '',
    investment_range: '',
    current_portfolio_size: '',
    past_investments: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.password || !formData.first_name || !formData.last_name) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await signup({
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number || undefined,
      telegram_handle: formData.telegram_handle || undefined,
      website_url: formData.website_url || undefined,
      linkedin: formData.linkedin || undefined,
      user_type: formData.user_type,
      company: formData.company || undefined,
      location: formData.location || undefined,
      investment_focus: formData.investment_focus || undefined,
      preferred_category: formData.preferred_category || undefined,
      investment_range: formData.investment_range || undefined,
      current_portfolio_size: formData.current_portfolio_size || undefined,
      past_investments: formData.past_investments || undefined
    });
    
    if (!result.success) {
      setError(result.error || 'Signup failed');
    } else {
      // The signup success will trigger useAuth context to redirect appropriately
      // No need to manually redirect as the Signup component handles this
    }
  };

  return (
    <>
      {/* Role Selection */}
      <div className="mb-6">
        <Label className="text-base font-medium mb-4 block">I am a:</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card
            className={`cursor-pointer border-2 transition-colors ${
              formData.user_type === 'investor'
                ? 'border-brand-blue bg-brand-blue/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'investor' }))}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Investor</h3>
              <p className="text-sm text-gray-600 mt-1">I want to invest in startups</p>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer border-2 transition-colors ${
              formData.user_type === 'project_owner'
                ? 'border-brand-blue bg-brand-blue/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, user_type: 'project_owner' }))}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Project Owner</h3>
              <p className="text-sm text-gray-600 mt-1">I have a startup to fund</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Wide Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium">First Name *</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="John"
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium">Last Name *</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number" className="text-sm font-medium">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter password"
                  required
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telegram_handle" className="text-sm font-medium">Telegram Handle</Label>
                <Input
                  id="telegram_handle"
                  name="telegram_handle"
                  type="text"
                  value={formData.telegram_handle}
                  onChange={handleInputChange}
                  placeholder="@username"
                  disabled={isLoading}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url" className="text-sm font-medium">Website URL</Label>
                <Input
                  id="website_url"
                  name="website_url"
                  type="url"
                  value={formData.website_url}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                  disabled={isLoading}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="text-sm font-medium">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                name="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/yourprofile"
                disabled={isLoading}
                className="h-10"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Professional Information */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">
                {formData.user_type === 'investor' ? 'Investment Firm' : 'Company Name'}
              </Label>
              <Input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleInputChange}
                placeholder={
                  formData.user_type === 'investor'
                    ? 'Your investment firm or organization'
                    : 'Your startup or company name'
                }
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">Location</Label>
              <Input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                disabled={isLoading}
                className="h-10"
              />
            </div>

            {/* Investor-Specific Information */}
            {formData.user_type === 'investor' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="investment_focus" className="text-sm font-medium">Investment Focus</Label>
                  <Textarea
                    id="investment_focus"
                    name="investment_focus"
                    value={formData.investment_focus}
                    onChange={handleInputChange}
                    placeholder="Describe your investment focus areas and interests..."
                    disabled={isLoading}
                    className="min-h-[80px] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_category" className="text-sm font-medium">Preferred Category</Label>
                    <Select
                      value={formData.preferred_category}
                      onValueChange={(value) => handleSelectChange('preferred_category', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="fintech">FinTech</SelectItem>
                        <SelectItem value="biotech">Biotech</SelectItem>
                        <SelectItem value="e-commerce">E-commerce</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="ai-ml">AI/ML</SelectItem>
                        <SelectItem value="blockchain">Blockchain</SelectItem>
                        <SelectItem value="cleantech">CleanTech</SelectItem>
                        <SelectItem value="real-estate">Real Estate</SelectItem>
                        <SelectItem value="consumer">Consumer Products</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="investment_range" className="text-sm font-medium">Investment Range</Label>
                    <Select
                      value={formData.investment_range}
                      onValueChange={(value) => handleSelectChange('investment_range', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under-10k">Under $10k</SelectItem>
                        <SelectItem value="10k-50k">$10k - $50k</SelectItem>
                        <SelectItem value="50k-100k">$50k - $100k</SelectItem>
                        <SelectItem value="100k-500k">$100k - $500k</SelectItem>
                        <SelectItem value="500k-1m">$500k - $1M</SelectItem>
                        <SelectItem value="1m-5m">$1M - $5M</SelectItem>
                        <SelectItem value="5m-plus">$5M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_portfolio_size" className="text-sm font-medium">Current Portfolio Size</Label>
                  <Select
                    value={formData.current_portfolio_size}
                    onValueChange={(value) => handleSelectChange('current_portfolio_size', value)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select portfolio size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-investor">New Investor</SelectItem>
                      <SelectItem value="1-5">1-5 investments</SelectItem>
                      <SelectItem value="6-10">6-10 investments</SelectItem>
                      <SelectItem value="11-25">11-25 investments</SelectItem>
                      <SelectItem value="26-50">26-50 investments</SelectItem>
                      <SelectItem value="50-plus">50+ investments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="past_investments" className="text-sm font-medium">Past Investments</Label>
                  <Textarea
                    id="past_investments"
                    name="past_investments"
                    value={formData.past_investments}
                    onChange={handleInputChange}
                    placeholder="Describe your past investment experience and notable investments..."
                    disabled={isLoading}
                    className="min-h-[80px] text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          By creating an account, you agree to our{' '}
          <a href="#" className="text-brand-blue hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-brand-blue hover:underline">Privacy Policy</a>.
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-brand-blue hover:text-brand-blue/80">
            Sign in
          </a>
        </p>
      </div>
    </>
  );
};

export default SignupForm;