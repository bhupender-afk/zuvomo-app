import React, { useState, useEffect } from 'react';
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
import { useToastMessages } from '@/hooks/use-toast';

interface CaseStudyEditFormProps {
  caseStudy: any;
  onCaseStudyUpdated: (caseStudy: any) => void;
  onCancel: () => void;
}

const CaseStudyEditForm: React.FC<CaseStudyEditFormProps> = ({ caseStudy, onCaseStudyUpdated, onCancel }) => {
  const { success, error } = useToastMessages();
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

  // Initialize form data with case study data
  useEffect(() => {
    if (caseStudy) {
      setFormData({
        title: caseStudy.title || '',
        company_name: caseStudy.company_name || caseStudy.client_name || '',
        industry: caseStudy.industry || '',
        company_size: caseStudy.company_size || '',
        challenge: caseStudy.challenge || '',
        solution: caseStudy.solution || '',
        results: caseStudy.results || '',
        content: caseStudy.content || '',
        featured_image: caseStudy.featured_image || '',
        company_logo: caseStudy.company_logo || '',
        testimonial: caseStudy.testimonial || '',
        testimonial_author: caseStudy.testimonial_author || '',
        testimonial_position: caseStudy.testimonial_position || '',
        metrics: typeof caseStudy.metrics === 'string' ? JSON.parse(caseStudy.metrics || '{}') : (caseStudy.metrics || {}),
        tags: Array.isArray(caseStudy.tags) ? caseStudy.tags : (typeof caseStudy.tags === 'string' ? JSON.parse(caseStudy.tags || '[]') : []),
        status: caseStudy.status || 'draft',
        is_featured: caseStudy.is_featured || caseStudy.featured || false,
        completion_date: caseStudy.completion_date || '',
        project_duration: caseStudy.project_duration || ''
      });
    }
  }, [caseStudy]);

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
    setFormData(prev => ({
      ...prev,
      metrics: Object.fromEntries(
        Object.entries(prev.metrics).filter(([key]) => key !== keyToRemove)
      )
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'featured' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await api.post('/admin/upload', formDataUpload);

      if (response.data?.success) {
        const imageUrl = response.data.fileUrl;
        const field = type === 'featured' ? 'featured_image' : 'company_logo';
        handleInputChange(field, imageUrl);
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (uploadError: any) {
      console.error('Image upload error:', uploadError);
      error(uploadError.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (status: string = formData.status) => {
    if (!formData.title.trim() || !formData.company_name.trim() || !formData.challenge.trim() || !formData.solution.trim() || !formData.results.trim()) {
      error('Please fill in all required fields: Title, Company Name, Challenge, Solution, and Results.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        status
      };

      const response = await api.put(`/case-studies/${caseStudy.id}`, submitData);

      if (response.data?.success) {
        success(`Case study ${status === 'published' ? 'published' : 'updated'} successfully!`);
        onCaseStudyUpdated(response.data.data);
      } else {
        throw new Error(response.data?.message || 'Failed to update case study');
      }
    } catch (updateError: any) {
      console.error('Case study update error:', updateError);
      error(updateError.response?.data?.message || 'Failed to update case study. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Case Study</h2>
          <p className="text-gray-600">Update your case study content and settings</p>
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
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Case Study Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter case study title..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    placeholder="Enter company name..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Technology, Healthcare, Finance..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="company_size">Company Size</Label>
                  <Select
                    value={formData.company_size}
                    onValueChange={(value) => handleInputChange('company_size', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                      <SelectItem value="small">Small (11-50 employees)</SelectItem>
                      <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                      <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="project_duration">Project Duration</Label>
                  <Input
                    id="project_duration"
                    value={formData.project_duration}
                    onChange={(e) => handleInputChange('project_duration', e.target.value)}
                    placeholder="e.g., 6 months, 1 year..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Case Study Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Case Study Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="challenge">Challenge *</Label>
                <Textarea
                  id="challenge"
                  value={formData.challenge}
                  onChange={(e) => handleInputChange('challenge', e.target.value)}
                  placeholder="Describe the main challenge or problem..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="solution">Solution *</Label>
                <Textarea
                  id="solution"
                  value={formData.solution}
                  onChange={(e) => handleInputChange('solution', e.target.value)}
                  placeholder="Describe the solution provided..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="results">Results *</Label>
                <Textarea
                  id="results"
                  value={formData.results}
                  onChange={(e) => handleInputChange('results', e.target.value)}
                  placeholder="Describe the outcomes and results achieved..."
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="content">Additional Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  placeholder="Add any additional detailed content..."
                  rows={6}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Testimonial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Client Testimonial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="testimonial">Testimonial Quote</Label>
                <Textarea
                  id="testimonial"
                  value={formData.testimonial}
                  onChange={(e) => handleInputChange('testimonial', e.target.value)}
                  placeholder="Client testimonial or quote..."
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
                    placeholder="Testimonial author name..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="testimonial_position">Author Position</Label>
                  <Input
                    id="testimonial_position"
                    value={formData.testimonial_position}
                    onChange={(e) => handleInputChange('testimonial_position', e.target.value)}
                    placeholder="Author job title/position..."
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
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

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleSubmit('draft')}
                  variant="outline"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => handleSubmit('published')}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Updating...' : 'Update & Publish'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Featured Image */}
              <div>
                <Label htmlFor="featured_image_upload">Featured Image</Label>
                <div className="mt-1">
                  <input
                    id="featured_image_upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'featured')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('featured_image_upload')?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose Featured Image'}
                  </Button>
                </div>

                {formData.featured_image && (
                  <div className="space-y-2 mt-2">
                    <img
                      src={formData.featured_image}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('featured_image', '')}
                      className="w-full"
                    >
                      Remove Featured Image
                    </Button>
                  </div>
                )}
              </div>

              {/* Company Logo */}
              <div>
                <Label htmlFor="company_logo_upload">Company Logo</Label>
                <div className="mt-1">
                  <input
                    id="company_logo_upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('company_logo_upload')?.click()}
                    disabled={isUploading}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose Company Logo'}
                  </Button>
                </div>

                {formData.company_logo && (
                  <div className="space-y-2 mt-2">
                    <img
                      src={formData.company_logo}
                      alt="Company Logo"
                      className="w-full h-20 object-contain rounded border bg-gray-50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleInputChange('company_logo', '')}
                      className="w-full"
                    >
                      Remove Company Logo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Key Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metric_input">Add Metrics</Label>
                <div className="space-y-2 mt-1">
                  <Input
                    id="metric_key"
                    value={currentMetricKey}
                    onChange={(e) => setCurrentMetricKey(e.target.value)}
                    placeholder="Metric name (e.g., ROI, Growth)"
                  />
                  <Input
                    id="metric_value"
                    value={currentMetricValue}
                    onChange={(e) => setCurrentMetricValue(e.target.value)}
                    placeholder="Metric value (e.g., 150%, $1.2M)"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMetric}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Metric
                  </Button>
                </div>
              </div>

              {Object.entries(formData.metrics).length > 0 && (
                <div>
                  <Label>Current Metrics</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(formData.metrics).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium text-sm">{key}:</span>
                          <span className="text-sm ml-1">{value}</span>
                        </div>
                        <X
                          className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500"
                          onClick={() => removeMetric(key)}
                        />
                      </div>
                    ))}
                  </div>
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
              <div>
                <Label htmlFor="tag_input">Add Tags</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="tag_input"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Enter tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div>
                  <Label>Current Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaseStudyEditForm;