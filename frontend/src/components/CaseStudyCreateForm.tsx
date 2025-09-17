import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload, Eye, Save, TrendingUp, Target, CheckCircle } from 'lucide-react';
import api from '../services/api';

interface CaseStudyCreateFormProps {
  onCaseStudyCreated: (caseStudy: any) => void;
  onCancel: () => void;
}

const CaseStudyCreateForm: React.FC<CaseStudyCreateFormProps> = ({ onCaseStudyCreated, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    industry: '',
    company_size: '',
    challenge: '',
    solution: '',
    results: '',
    content: '',
    featured_image: '',
    company_logo: '',
    testimonial: '',
    testimonial_author: '',
    testimonial_position: '',
    metrics: {} as Record<string, string>,
    tags: [] as string[],
    status: 'draft',
    is_featured: false,
    completion_date: '',
    project_duration: ''
  });
  
  const [currentTag, setCurrentTag] = useState('');
  const [currentMetricKey, setCurrentMetricKey] = useState('');
  const [currentMetricValue, setCurrentMetricValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addMetric = () => {
    if (currentMetricKey.trim() && currentMetricValue.trim()) {
      setFormData(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [currentMetricKey.trim()]: currentMetricValue.trim()
        }
      }));
      setCurrentMetricKey('');
      setCurrentMetricValue('');
    }
  };

  const removeMetric = (keyToRemove: string) => {
    setFormData(prev => {
      const newMetrics = { ...prev.metrics };
      delete newMetrics[keyToRemove];
      return {
        ...prev,
        metrics: newMetrics
      };
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'featured' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Image size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('type', type === 'featured' ? 'case_study_image' : 'company_logo');

      const response = await api.post('/admin/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data?.success) {
        const field = type === 'featured' ? 'featured_image' : 'company_logo';
        handleInputChange(field, response.data.fileUrl);
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!formData.title.trim() || !formData.company_name.trim() || 
        !formData.challenge.trim() || !formData.solution.trim() || !formData.results.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        status
      };

      const response = await api.post('/case-studies', submitData);

      if (response.data?.success) {
        onCaseStudyCreated(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to create case study');
      }
    } catch (error: any) {
      console.error('Case study creation error:', error);
      alert(error.response?.data?.message || 'Failed to create case study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
    'Real Estate', 'Entertainment', 'Transportation', 'Energy', 'Food & Beverage', 'Other'
  ];

  const companySizes = [
    'Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Create Case Study</h2>
          <p className="text-gray-600">Showcase a success story and client achievements</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Case Study Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., TechCorp: 300% Revenue Growth in 12 Months"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Client company name"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select value={formData.company_size} onValueChange={(value) => handleInputChange('company_size', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project_duration">Project Duration</Label>
                  <Input
                    id="project_duration"
                    value={formData.project_duration}
                    onChange={(e) => handleInputChange('project_duration', e.target.value)}
                    placeholder="e.g., 6 months"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="completion_date">Completion Date</Label>
                <Input
                  id="completion_date"
                  type="date"
                  value={formData.completion_date}
                  onChange={(e) => handleInputChange('completion_date', e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Challenge, Solution, Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                The Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.challenge}
                onChange={(e) => handleInputChange('challenge', e.target.value)}
                placeholder="Describe the main challenges the client was facing..."
                rows={4}
                className="mt-1"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Our Solution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.solution}
                onChange={(e) => handleInputChange('solution', e.target.value)}
                placeholder="Explain the approach and strategy used to solve the challenges..."
                rows={4}
                className="mt-1"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                The Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.results}
                onChange={(e) => handleInputChange('results', e.target.value)}
                placeholder="Describe the outcomes and impact achieved..."
                rows={4}
                className="mt-1"
              />
            </CardContent>
          </Card>

          {/* Additional Content */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content">Detailed Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Add any additional detailed information, process details, or methodology..."
                  rows={6}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <Card>
            <CardHeader>
              <CardTitle>Client Testimonial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testimonial">Testimonial Quote</Label>
                <Textarea
                  id="testimonial"
                  value={formData.testimonial}
                  onChange={(e) => handleInputChange('testimonial', e.target.value)}
                  placeholder="What did the client say about working with you?"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testimonial_author">Author Name</Label>
                  <Input
                    id="testimonial_author"
                    value={formData.testimonial_author}
                    onChange={(e) => handleInputChange('testimonial_author', e.target.value)}
                    placeholder="e.g., John Smith"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="testimonial_position">Author Position</Label>
                  <Input
                    id="testimonial_position"
                    value={formData.testimonial_position}
                    onChange={(e) => handleInputChange('testimonial_position', e.target.value)}
                    placeholder="e.g., CEO & Founder"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="featured">Featured Case Study</Label>
                <Switch
                  id="featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleSubmit('draft')}
                  variant="outline"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting || !formData.title.trim() || !formData.company_name.trim() || 
                           !formData.challenge.trim() || !formData.solution.trim() || !formData.results.trim()}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Publishing...' : 'Publish Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Featured Image */}
              <div>
                <Label>Featured Image</Label>
                {formData.featured_image ? (
                  <div className="space-y-3 mt-2">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('featured_image', '')}
                      className="w-full"
                    >
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'featured')}
                      className="hidden"
                      id="featured-upload"
                    />
                    <label htmlFor="featured-upload">
                      <Button variant="outline" size="sm" disabled={isUploading} asChild>
                        <span>Upload Featured Image</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {/* Company Logo */}
              <div>
                <Label>Company Logo</Label>
                {formData.company_logo ? (
                  <div className="space-y-3 mt-2">
                    <img
                      src={formData.company_logo}
                      alt="Company Logo"
                      className="w-full h-16 object-contain bg-gray-50 rounded-md p-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('company_logo', '')}
                      className="w-full"
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mt-2">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button variant="outline" size="sm" disabled={isUploading} asChild>
                        <span>Upload Company Logo</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Success Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={currentMetricKey}
                  onChange={(e) => setCurrentMetricKey(e.target.value)}
                  placeholder="Metric name (e.g., Revenue Growth)"
                  size="sm"
                />
                <Input
                  value={currentMetricValue}
                  onChange={(e) => setCurrentMetricValue(e.target.value)}
                  placeholder="Value (e.g., 300%)"
                  size="sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMetric}
                  disabled={!currentMetricKey.trim() || !currentMetricValue.trim()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Metric
                </Button>
              </div>

              {Object.keys(formData.metrics).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(formData.metrics).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <div className="font-medium">{key}</div>
                        <div className="text-gray-600">{value}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMetric(key)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  disabled={!currentTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyCreateForm;