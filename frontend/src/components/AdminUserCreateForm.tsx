import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Lock, Building, MapPin, UserCheck } from 'lucide-react';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company?: string;
  location?: string;
  is_verified: boolean;
  is_active: boolean;
  approval_status: string;
  created_at: string;
}

interface AdminUserCreateFormProps {
  onUserCreated: (user: User) => void;
  onCancel: () => void;
}

export const AdminUserCreateForm: React.FC<AdminUserCreateFormProps> = ({
  onUserCreated,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: '',
    company: '',
    location: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.user_type) {
      newErrors.user_type = 'User type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/admin/users', formData);
      
      if (response.data.user) {
        // Map backend response to frontend User interface
        const newUser: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          role: response.data.user.role,
          company: response.data.user.company,
          location: response.data.user.location,
          is_verified: response.data.user.is_verified,
          is_active: true,
          approval_status: response.data.user.approval_status,
          created_at: new Date().toISOString()
        };
        
        onUserCreated(newUser);
      }
    } catch (error: any) {
      console.error('Create user error:', error);
      
      if (error.response?.data?.error) {
        if (error.response.data.error.includes('email already exists')) {
          setErrors({ email: 'A user with this email already exists' });
        } else {
          setErrors({ general: error.response.data.error });
        }
      } else {
        setErrors({ general: 'Failed to create user. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="user@example.com"
              className={errors.email ? 'border-red-300' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Minimum 6 characters"
              className={errors.password ? 'border-red-300' : ''}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                First Name
              </Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="John"
                className={errors.first_name ? 'border-red-300' : ''}
              />
              {errors.first_name && (
                <p className="text-red-500 text-sm">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Doe"
                className={errors.last_name ? 'border-red-300' : ''}
              />
              {errors.last_name && (
                <p className="text-red-500 text-sm">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* User Type */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              User Type
            </Label>
            <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
              <SelectTrigger className={errors.user_type ? 'border-red-300' : ''}>
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="project_owner">Project Owner</SelectItem>
              </SelectContent>
            </Select>
            {errors.user_type && (
              <p className="text-red-500 text-sm">{errors.user_type}</p>
            )}
          </div>

          {/* Optional Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Company (Optional)
              </Label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location (Optional)
              </Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#2C91D5] hover:bg-[#1e6ba8]"
            >
              {isLoading ? 'Creating User...' : 'Create User'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};