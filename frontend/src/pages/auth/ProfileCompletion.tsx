import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Briefcase, DollarSign, MapPin, Building, User, Users, FileText } from 'lucide-react';

const ProfileCompletion = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'investor' | 'project_owner' | null>(null);

  const provider = searchParams.get('provider');
  const isNewUser = searchParams.get('isNewUser') === 'true';
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    company: '',
    location: '',
    bio: '',
    phone: '',
    linkedin_url: '',
    investment_range_min: '',
    investment_range_max: '',
    preferred_industries: [] as string[],
    experience_years: '',
    portfolio_size: '',
    investment_stage: '',
    geographic_focus: ''
  });

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce',
    'SaaS', 'Mobile Apps', 'AI/ML', 'Blockchain', 'Green Tech',
    'Food & Beverage', 'Fashion', 'Travel', 'Real Estate', 'Manufacturing'
  ];

  const investmentStages = [
    'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Late Stage'
  ];

  const handleIndustryToggle = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_industries: prev.preferred_industries.includes(industry)
        ? prev.preferred_industries.filter(i => i !== industry)
        : [...prev.preferred_industries, industry]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select whether you're an investor or project owner.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Update user profile with selected role and additional information
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/complete-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_type: selectedRole,
          ...formData,
          preferred_industries: formData.preferred_industries.join(',')
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update auth context with new user data
        setUser(data.user);

        toast({
          title: "Profile Completed!",
          description: `Welcome to Zuvomo! Your ${selectedRole === 'investor' ? 'investor' : 'project owner'} profile has been set up.`,
        });

        // Redirect to appropriate dashboard
        navigate(selectedRole === 'investor' ? '/investor' : '/project-owner');
      } else {
        throw new Error(data.error || 'Profile completion failed');
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast({
        title: "Profile Completion Failed",
        description: error.message || "Failed to complete profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Welcome! You've successfully signed in{provider ? ` with ${provider}` : ''}.
            Please choose your role and complete your profile to get started.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">I am a:</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedRole === 'investor'
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRole('investor')}
              >
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <h3 className="font-semibold text-lg">Investor</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Looking to invest in promising startups and projects
                  </p>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedRole === 'project_owner'
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRole('project_owner')}
              >
                <CardContent className="p-4 text-center">
                  <Briefcase className="w-12 h-12 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-semibold text-lg">Project Owner</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Looking to raise funding for my startup or project
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {selectedRole && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">
                    <Building className="w-4 h-4 inline mr-1" />
                    Company/Organization
                  </Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Bio/Description
                </Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={
                    selectedRole === 'investor'
                      ? "Tell us about your investment focus and experience..."
                      : "Describe your project or startup..."
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>

              {/* Investor-specific fields */}
              {selectedRole === 'investor' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="investment-min">Investment Range (Min)</Label>
                      <Select
                        value={formData.investment_range_min}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, investment_range_min: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Minimum investment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1000">$1,000</SelectItem>
                          <SelectItem value="5000">$5,000</SelectItem>
                          <SelectItem value="10000">$10,000</SelectItem>
                          <SelectItem value="25000">$25,000</SelectItem>
                          <SelectItem value="50000">$50,000</SelectItem>
                          <SelectItem value="100000">$100,000</SelectItem>
                          <SelectItem value="250000">$250,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="investment-max">Investment Range (Max)</Label>
                      <Select
                        value={formData.investment_range_max}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, investment_range_max: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Maximum investment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10000">$10,000</SelectItem>
                          <SelectItem value="25000">$25,000</SelectItem>
                          <SelectItem value="50000">$50,000</SelectItem>
                          <SelectItem value="100000">$100,000</SelectItem>
                          <SelectItem value="250000">$250,000</SelectItem>
                          <SelectItem value="500000">$500,000</SelectItem>
                          <SelectItem value="1000000">$1,000,000+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Select
                        value={formData.experience_years}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, experience_years: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Investment experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 years</SelectItem>
                          <SelectItem value="2-3">2-3 years</SelectItem>
                          <SelectItem value="4-5">4-5 years</SelectItem>
                          <SelectItem value="6-10">6-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stage">Preferred Investment Stage</Label>
                      <Select
                        value={formData.investment_stage}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, investment_stage: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Investment stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {investmentStages.map(stage => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Industry Preferences */}
              <div className="space-y-2">
                <Label>
                  <Users className="w-4 h-4 inline mr-1" />
                  {selectedRole === 'investor' ? 'Preferred' : 'Your'} Industries
                </Label>
                <div className="flex flex-wrap gap-2">
                  {industries.map(industry => (
                    <Badge
                      key={industry}
                      variant={formData.preferred_industries.includes(industry) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleIndustryToggle(industry)}
                    >
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !selectedRole}
              >
                {loading ? 'Completing Profile...' : 'Complete Profile & Get Started'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletion;