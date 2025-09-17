import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Card, CardContent } from '../ui/card';

const SignupForm: React.FC = () => {
  const { signup, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: 'investor' as 'project_owner' | 'investor',
    company: '',
    location: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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
      user_type: formData.user_type,
      company: formData.company || undefined,
      location: formData.location || undefined
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

        {/* Personal Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="John"
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Doe"
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@example.com"
            required
            disabled={isLoading}
            className="h-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Minimum 6 characters"
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter password"
              required
              disabled={isLoading}
              className="h-11"
            />
          </div>
        </div>

        {/* Optional Information */}
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="company">
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
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
              disabled={isLoading}
              className="h-11"
            />
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