import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Upload, X, Save, Check, FileText, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

interface Project {
  id: string;
  title: string;
  description: string;
  industry: string;
  stage: string;
  funding_goal: number;
  current_funding: number;
  funding_from_other_sources: number;
  valuation: number;
  location: string;
  team_size: string;
  tags: string[];
  image_url?: string;
  logo_url?: string;
  status: string;
  is_featured: boolean;
  pitch_deck_url?: string;
}

interface AdminProjectEditFormProps {
  project: Project;
  onSave: (updatedProject: Project) => void;
  onCancel: () => void;
  onSaveAndApprove?: (updatedProject: Project) => void;
  showApprovalActions?: boolean;
}

const AdminProjectEditForm: React.FC<AdminProjectEditFormProps> = ({
  project,
  onSave,
  onCancel,
  onSaveAndApprove,
  showApprovalActions = false
}) => {
  const [formData, setFormData] = useState({
    title: project.title || '',
    description: project.description || '',
    industry: project.industry || '',
    stage: project.stage || 'idea',
    funding_goal: project.funding_goal?.toString() || '',
    current_funding: project.current_funding?.toString() || '0',
    funding_from_other_sources: project.funding_from_other_sources?.toString() || '0',
    valuation: project.valuation?.toString() || '',
    location: project.location || '',
    team_size: project.team_size?.toString() || '1',
    tags: Array.isArray(project.tags) ? project.tags : 
          typeof project.tags === 'string' ? project.tags.split(',').map(t => t.trim()) : [],
    is_featured: project.is_featured || false
  });

  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File}>({});
  const [loading, setSaving] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [newTag, setNewTag] = useState('');

  const industries = [
    'Finance', 'Blockchain', 'AI', 'Healthcare', 'Education', 'E-commerce',
    'Gaming', 'Real Estate', 'Energy', 'Food Tech', 'SaaS', 'DeFi', 'Tech'
  ];

  const stages = [
    { value: 'idea', label: 'Idea' },
    { value: 'prototype', label: 'Prototype' },
    { value: 'mvp', label: 'MVP' },
    { value: 'early_revenue', label: 'Early Revenue' },
    { value: 'established', label: 'Established' }
  ];

  const availableTags = [
    'Finance', 'Healthcare', 'Education', 'Gaming', 'Real Estate', 'Bitcoin L2',
    'Solana', 'Arbitrum', 'Binance', 'Defi', 'RWA', 'AI', 'MM'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileSelect = (fileType: string, file: File) => {
    setSelectedFiles(prev => ({ ...prev, [fileType]: file }));
  };

  const removeFile = (fileType: string) => {
    setSelectedFiles(prev => {
      const updated = { ...prev };
      delete updated[fileType];
      return updated;
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.funding_goal || parseFloat(formData.funding_goal) <= 0) {
      newErrors.funding_goal = 'Valid funding goal is required';
    }
    if (!formData.location.trim()) newErrors.location = 'Location is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFiles = async (projectId: string) => {
    const uploadPromises = [];

    for (const [fileType, file] of Object.entries(selectedFiles)) {
      const formData = new FormData();
      
      if (fileType === 'main_image') {
        formData.append('image', file);
        formData.append('image_type', 'main');
        uploadPromises.push(
          api.uploadFile(`/projects/${projectId}/image`, formData)
        );
      } else if (fileType === 'pitch_deck') {
        formData.append('files', file);
        formData.append('file_type', 'pitch_deck');
        formData.append('description', 'Pitch deck document');
        uploadPromises.push(
          api.uploadFile(`/projects/${projectId}/upload`, formData)
        );
      }
    }

    if (uploadPromises.length > 0) {
      try {
        await Promise.all(uploadPromises);
        console.log('All files uploaded successfully');
      } catch (error) {
        console.error('Error uploading files:', error);
        throw new Error('Failed to upload files');
      }
    }
  };

  const handleSave = async (approve = false) => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Prepare update data
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        industry: formData.industry,
        stage: formData.stage,
        funding_goal: parseFloat(formData.funding_goal),
        current_funding: parseFloat(formData.current_funding),
        funding_from_other_sources: parseFloat(formData.funding_from_other_sources),
        valuation: formData.valuation ? parseFloat(formData.valuation) : null,
        location: formData.location.trim(),
        team_size: formData.team_size,
        tags: formData.tags.join(','),
        is_featured: formData.is_featured
      };

      console.log('Admin editing project:', project.id, updateData);

      // Update project via admin API
      const response = await api.put(`/projects/admin/${project.id}/edit`, updateData);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Upload files if any
      if (Object.keys(selectedFiles).length > 0) {
        await uploadFiles(project.id);
      }

      // Create updated project object
      const updatedProject = {
        ...project,
        ...updateData,
        tags: formData.tags
      };

      console.log('Project updated successfully');

      if (approve && onSaveAndApprove) {
        onSaveAndApprove(updatedProject);
      } else {
        onSave(updatedProject);
      }

    } catch (error) {
      console.error('Error updating project:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to update project' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{errors.general}</p>
        </div>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? 'border-red-500' : ''}
              maxLength={100}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
              rows={4}
              maxLength={2000}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger className={errors.industry ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && <p className="text-red-500 text-sm mt-1">{errors.industry}</p>}
            </div>

            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={formData.stage} onValueChange={(value) => handleInputChange('stage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>{stage.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={errors.location ? 'border-red-500' : ''}
              placeholder="e.g., San Francisco, CA"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Funding Information */}
      <Card>
        <CardHeader>
          <CardTitle>Funding Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="funding_goal">Funding Goal ($) *</Label>
              <Input
                id="funding_goal"
                type="number"
                value={formData.funding_goal}
                onChange={(e) => handleInputChange('funding_goal', e.target.value)}
                className={errors.funding_goal ? 'border-red-500' : ''}
                min="1000"
                step="1000"
              />
              {errors.funding_goal && <p className="text-red-500 text-sm mt-1">{errors.funding_goal}</p>}
            </div>

            <div>
              <Label htmlFor="current_funding">Current Funding ($)</Label>
              <Input
                id="current_funding"
                type="number"
                value={formData.current_funding}
                onChange={(e) => handleInputChange('current_funding', e.target.value)}
                min="0"
                step="1000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="funding_from_other_sources">Other Sources ($)</Label>
              <Input
                id="funding_from_other_sources"
                type="number"
                value={formData.funding_from_other_sources}
                onChange={(e) => handleInputChange('funding_from_other_sources', e.target.value)}
                min="0"
                step="1000"
              />
            </div>

            <div>
              <Label htmlFor="valuation">Valuation ($)</Label>
              <Input
                id="valuation"
                type="number"
                value={formData.valuation}
                onChange={(e) => handleInputChange('valuation', e.target.value)}
                min="0"
                step="10000"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="team_size">Team Size</Label>
            <Input
              id="team_size"
              type="number"
              value={formData.team_size}
              onChange={(e) => handleInputChange('team_size', e.target.value)}
              min="1"
              max="100"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tags and Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Tags and Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add custom tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button type="button" onClick={addTag}>Add</Button>
          </div>

          <div>
            <Label>Quick Add Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="cursor-pointer hover:bg-blue-100"
                  onClick={() => handleInputChange('tags', [...formData.tags, tag])}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={(e) => handleInputChange('is_featured', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_featured">Featured Project</Label>
          </div>
        </CardContent>
      </Card>

      {/* File Management */}
      <Card>
        <CardHeader>
          <CardTitle>Files & Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Image */}
          {(project.image_url || project.logo_url) && (
            <div>
              <Label>Current Project Image</Label>
              <div className="mt-2">
                <img 
                  src={`http://13.200.209.191:8080${project.image_url || project.logo_url}`}
                  alt={project.title}
                  className="w-32 h-24 object-cover rounded-lg border"
                />
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div>
            <Label>Upload New Project Image</Label>
            <div className="mt-2">
              {selectedFiles.main_image ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <ImageIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">{selectedFiles.main_image.name}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeFile('main_image')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload project image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect('main_image', e.target.files[0])}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button type="button" variant="outline" className="cursor-pointer">
                      Choose Image
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Pitch Deck Upload */}
          <div>
            <Label>Upload Pitch Deck (Optional)</Label>
            <div className="mt-2">
              {selectedFiles.pitch_deck ? (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="w-5 h-5 text-green-500" />
                  <span className="text-sm">{selectedFiles.pitch_deck.name}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeFile('pitch_deck')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Upload pitch deck (PDF, PPT, PPTX)</p>
                  <input
                    type="file"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect('pitch_deck', e.target.files[0])}
                    className="hidden"
                    id="deck-upload"
                  />
                  <label htmlFor="deck-upload">
                    <Button type="button" variant="outline" className="cursor-pointer">
                      Choose File
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={() => handleSave(false)} 
          disabled={loading}
          className="flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        {showApprovalActions && onSaveAndApprove && (
          <Button 
            onClick={() => handleSave(true)} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 flex items-center"
          >
            <Check className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save & Approve'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AdminProjectEditForm;