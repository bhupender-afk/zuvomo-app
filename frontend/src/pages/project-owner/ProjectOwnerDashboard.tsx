import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProtectedRoute from '../../components/ProtectedRoute';
import ProjectCard from '../../components/ProjectCard';
import ProjectDetailsModal from '../../components/ProjectDetailsModal';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Progress } from '../../components/ui/progress';
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Settings, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  Upload,
  Save,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  Building,
  Calendar,
  Star,
  Activity
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  industry: string;
  subcategory?: string;
  funding_goal: number;
  current_funding: number;
  funding_from_other_sources?: number;
  equity_percentage: number;
  location: string;
  team_size: number;
  project_stage: string;
  status: string;
  tags?: string | string[];
  image_url?: string;
  video_url?: string;
  business_plan_url?: string;
  pitch_deck_url?: string;
  valuation?: number;
  average_rating: number;
  rating_count: number;
  progress_percentage: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  admin_notes?: string;
  rejected_reason?: string;
  funding_percentage: number;
}

interface ProjectFormData {
  title: string;
  description: string;
  industry: string;
  funding_goal: string;
  funding_from_other_sources: string;
  location: string;
  team_size: string;
  project_stage: string;
  valuation: string;
  tags: string[];
}

interface ProjectStats {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  draft: number;
  totalFunding: number;
  avgProgress: number;
}

interface ValidationErrors {
  [key: string]: string;
}

const ProjectOwnerDashboard: React.FC = () => {
  const { user,logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    draft: 0,
    totalFunding: 0,
    avgProgress: 0
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<Project | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    industry: '',
    funding_goal: '',
    funding_from_other_sources: '0',
    location: '',
    team_size: '1',
    project_stage: 'idea',
    valuation: '',
    tags: []
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File}>({});
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/my/projects');
      if (response.data) {
        const projectList = response.data.projects || [];
        setProjects(projectList);
        
        // Calculate comprehensive stats
        const projectStats = projectList.reduce((acc: ProjectStats, project: Project) => ({
          total: acc.total + 1,
          approved: acc.approved + (project.status === 'approved' ? 1 : 0),
          pending: acc.pending + (project.status === 'pending' ? 1 : 0),
          rejected: acc.rejected + (project.status === 'rejected' ? 1 : 0),
          draft: acc.draft + (project.status === 'draft' ? 1 : 0),
          totalFunding: acc.totalFunding + (project.current_funding || 0),
          avgProgress: acc.avgProgress + (project.progress_percentage || 0)
        }), { total: 0, approved: 0, pending: 0, rejected: 0, draft: 0, totalFunding: 0, avgProgress: 0 });
        
        if (projectStats.total > 0) {
          projectStats.avgProgress = projectStats.avgProgress / projectStats.total;
        } else {
          projectStats.avgProgress = 0;
        }
        
        setStats(projectStats);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Title validation (5-100 characters)
    const title = formData.title.trim();
    if (!title) {
      errors.title = 'Project title is required';
    } else if (title.length < 5) {
      errors.title = 'Title must be at least 5 characters long';
    } else if (title.length > 100) {
      errors.title = 'Title must be no more than 100 characters long';
    }
    
    // Description validation (50-2000 characters)
    const description = formData.description.trim();
    if (!description) {
      errors.description = 'Project description is required';
    } else if (description.length < 50) {
      errors.description = 'Description must be at least 50 characters long';
    } else if (description.length > 2000) {
      errors.description = 'Description must be no more than 2000 characters long';
    }
    
    if (!formData.industry) errors.industry = 'Industry is required';
    
    // Location validation (1-100 characters)
    const location = formData.location.trim();
    if (!location) {
      errors.location = 'Location is required';
    } else if (location.length > 100) {
      errors.location = 'Location must be no more than 100 characters long';
    }
    
    // Funding goal validation ($1,000 - $10,000,000)
    const fundingGoal = parseFloat(formData.funding_goal);
    if (!fundingGoal || isNaN(fundingGoal)) {
      errors.funding_goal = 'Funding goal is required';
    } else if (fundingGoal < 1000) {
      errors.funding_goal = 'Funding goal must be at least $1,000';
    } else if (fundingGoal > 10000000) {
      errors.funding_goal = 'Funding goal must be no more than $10,000,000';
    }
    
    const fundingFromOtherSources = parseFloat(formData.funding_from_other_sources);
    if (isNaN(fundingFromOtherSources) || fundingFromOtherSources < 0) errors.funding_from_other_sources = 'Valid funding amount is required (0 or more)';
    
    // Team size validation (1-100)
    const teamSize = parseInt(formData.team_size);
    if (!teamSize || isNaN(teamSize) || teamSize < 1) {
      errors.team_size = 'Team size must be at least 1';
    } else if (teamSize > 100) {
      errors.team_size = 'Team size must be no more than 100';
    }
    
    if (formData.tags.length === 0) errors.tags = 'At least one tag is required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagSelect = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
    // Clear validation error
    if (validationErrors.tags) {
      setValidationErrors(prev => ({ ...prev, tags: '' }));
    }
  };

  const handleFileSelect = (fileType: string, file: File) => {
    console.log('ProjectOwner: File selected', { fileType, fileName: file.name, fileSize: file.size, fileType_mime: file.type });

    // Validate file based on type
    if (fileType === 'main_image') {
      // Image validation
      const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
      const maxImageSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedImageTypes.includes(file.type)) {
        alert('❌ Invalid image format!\n\nPlease upload one of these formats:\n• PNG (.png)\n• JPG (.jpg)\n• JPEG (.jpeg)\n• WEBP (.webp)');
        return;
      }
      
      if (file.size > maxImageSize) {
        alert(`❌ Image too large!\n\nFile size: ${(file.size / 1024 / 1024).toFixed(1)}MB\nMaximum allowed: 5MB\n\nPlease compress your image or use a smaller file.`);
        return;
      }

      // Check image dimensions (optional - for better user guidance)
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const { width, height } = img;
        const ratio = width / height;
        
        console.log('ProjectOwner: Image dimensions', { width, height, ratio });
        
        // Guidance for optimal dimensions
        if (width < 400 || height < 200) {
          const proceed = confirm(`⚠️ Image Resolution Notice\n\nUploaded: ${width}x${height}px\nRecommended: 400x300px or larger\n\nSmall images may appear blurry. Continue anyway?`);
          if (!proceed) return;
        }
        
        if (ratio < 1.2 || ratio > 2.2) {
          alert(`📐 Image Aspect Ratio Tip\n\nYour image ratio: ${ratio.toFixed(2)}:1\nRecommended: 1.3:1 to 2:1 (e.g., 400x300px)\n\nThis will ensure your image displays perfectly in project cards!`);
        }
      };
      
      img.src = objectUrl;
    } else if (fileType === 'pitch_deck') {
      // Pitch deck validation
      const allowedDocTypes = ['application/pdf', 
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      const maxDocSize = 10 * 1024 * 1024; // 10MB
      
      if (!allowedDocTypes.includes(file.type)) {
        alert('Invalid document format. Please upload PDF, PPT, or PPTX files only.');
        return;
      }
      
      if (file.size > maxDocSize) {
        alert('Document size too large. Please upload files smaller than 10MB.');
        return;
      }
    }
    
    setSelectedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
  };

  const removeSelectedFile = (fileType: string) => {
    setSelectedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fileType];
      return newFiles;
    });
  };

  const uploadProjectFiles = async (projectId: string): Promise<boolean> => {
    console.log('ProjectOwner: Starting file upload', {
      projectId,
      filesCount: Object.keys(selectedFiles).length,
      selectedFiles: Object.keys(selectedFiles)
    });

    if (Object.keys(selectedFiles).length === 0) {
      console.log('ProjectOwner: No files to upload');
      return true;
    }

    try {
      for (const [fileType, file] of Object.entries(selectedFiles)) {
        console.log('ProjectOwner: Uploading file', {
          fileType,
          fileName: file.name,
          fileSize: file.size,
          fileType_mime: file.type
        });

        const formData = new FormData();
        if (fileType === 'main_image') {
          formData.append('image', file);
          formData.append('image_type', 'main');
          
          console.log('ProjectOwner: Uploading to image endpoint', `/projects/${projectId}/image`);
          const response = await api.uploadFile(`/projects/${projectId}/image`, formData);
          console.log('ProjectOwner: Image upload response', response);
          
          if (response.error) {
            console.error(`ProjectOwner: Failed to upload ${fileType}:`, response.error);
            
            // Provide specific error messages based on common issues
            let errorMessage = response.error;
            if (response.error.includes('Invalid access token') || response.error.includes('401')) {
              errorMessage = 'Authentication failed. Please log in again and try uploading.';
            } else if (response.error.includes('File must be an image')) {
              errorMessage = 'Please select a valid image file (PNG, JPG, JPEG, or WEBP).';
            } else if (response.error.includes('Project not found')) {
              errorMessage = 'Project not found. Please save the project first, then add images.';
            } else if (response.error.includes('file size') || response.error.includes('size')) {
              errorMessage = 'Image file is too large. Please use an image smaller than 5MB.';
            }
            
            alert(`❌ Failed to upload project image\n\nError: ${errorMessage}\n\nTip: Try using a PNG or JPG image under 5MB.`);
            return false;
          }
          
          if (response.data) {
            console.log('ProjectOwner: Image uploaded successfully', response.data);
          } else {
            console.log('ProjectOwner: Image uploaded (no response data)');
          }
        } else {
          formData.append('files', file);
          formData.append('file_type', fileType);
          formData.append('description', `${fileType.replace('_', ' ')} document`);
          
          console.log('ProjectOwner: Uploading to files endpoint', `/projects/${projectId}/upload`);
          const response = await api.uploadFile(`/projects/${projectId}/upload`, formData);
          console.log('ProjectOwner: File upload response', response);
          
          if (response.error) {
            console.error(`ProjectOwner: Failed to upload ${fileType}:`, response.error);
            alert(`❌ Failed to upload ${fileType}: ${response.error}`);
            return false;
          }
          
          console.log('ProjectOwner: File uploaded successfully', fileType);
        }
      }
      
      console.log('ProjectOwner: All files uploaded successfully');
      return true;
    } catch (error) {
      console.error('ProjectOwner: Error uploading files:', error);
      alert('❌ Unexpected error during file upload. Please try again.');
      return false;
    }
  };

  const handleCreateProject = async () => {
    const isEditing = !!editingProjectId;
    if (!validateForm()) return;
    
    // Check authentication before proceeding
    const token = localStorage.getItem('zuvomo_access_token');
    const user = localStorage.getItem('zuvomo_user');
    
    if (!token) {
      alert('❌ Authentication Required\n\nYou must be logged in to create a project. Please log in and try again.');
      window.location.href = '/login';
      return;
    }
    
    if (!user) {
      alert('❌ User Session Invalid\n\nYour session is invalid. Please log in again.');
      localStorage.removeItem('zuvomo_access_token');
      window.location.href = '/login';
      return;
    }
    
    let userInfo;
    try {
      userInfo = JSON.parse(user);
      if (userInfo.role !== 'project_owner') {
        alert('❌ Access Denied\n\nOnly project owners can create projects. Please contact support if you believe this is an error.');
        return;
      }
    } catch (error) {
      alert('❌ Invalid User Data\n\nYour user session is corrupted. Please log in again.');
      localStorage.removeItem('zuvomo_access_token');
      localStorage.removeItem('zuvomo_user');
      window.location.href = '/login';
      return;
    }
    
    try {
      setCreateLoading(true);
      console.log('Creating project with user:', userInfo.id, 'Token length:', token.length);
      
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        industry: formData.industry,
        funding_goal: parseFloat(formData.funding_goal),
        funding_from_other_sources: parseFloat(formData.funding_from_other_sources),
        location: formData.location.trim(),
        team_size: parseInt(formData.team_size),
        project_stage: formData.project_stage,
        valuation: formData.valuation ? parseFloat(formData.valuation) : null,
        tags: formData.tags.join(',')
      };
      
      console.log('Sending project data:', projectData);
      
      // Use PUT for editing, POST for creating
      const result = isEditing 
        ? await api.put(`/projects/${editingProjectId}`, projectData)
        : await api.post('/projects', projectData);
      
      console.log('API response:', result);
      
      if (result.error) {
        // Handle specific error types
        if (result.error.includes('token') || result.error.includes('auth')) {
          alert('❌ Authentication Error\n\nYour session has expired. Please log in again.');
          localStorage.removeItem('zuvomo_access_token');
          localStorage.removeItem('zuvomo_user');
          window.location.href = '/login';
          return;
        }
        
        if (result.error.includes('validation')) {
          alert(`❌ Validation Error\n\n${result.error}\n\nPlease check your input and try again.`);
          return;
        }
        
        throw new Error(result.error);
      }
      
      // Verify the response structure
      if (!result.data || !result.data.project) {
        console.error('Unexpected API response structure:', result);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      // Upload files if project was created successfully
      if (result.data?.project?.id) {
        console.log('ProjectOwner: Uploading files for project:', result.data.project.id);
        const filesUploaded = await uploadProjectFiles(result.data.project.id);
        if (!filesUploaded) {
          console.warn('Project created but some files failed to upload');
          alert('⚠️ Project saved but some files failed to upload. Please try uploading them again by editing the project.');
        } else if (Object.keys(selectedFiles).length > 0) {
          console.log('ProjectOwner: All files uploaded successfully');
        }
      }
      
      // Reset form and close dialog
      setFormData({
        title: '',
        description: '',
        industry: '',
        funding_goal: '',
        funding_from_other_sources: '0',
        location: '',
        team_size: '1',
        project_stage: 'idea',
        valuation: '',
        tags: []
      });
      setValidationErrors({});
      setSelectedFiles({});
      setUploadProgress({});
      setShowCreateForm(false);
      setEditingProjectId(null);
      setExistingImageUrl(null);
      
      // Refresh projects list first to show updated data
      console.log('ProjectOwner: Refreshing projects list to show updated data');
      await fetchProjects();
      
      // Show success message with clear next steps
      const hasFiles = Object.keys(selectedFiles).length > 0;
      const updatedProjectStatus = result.data?.project?.project_status;
      
      let successMessage;
      if (isEditing) {
        if (updatedProjectStatus === 'pending_update') {
          successMessage = `🎉 Changes Submitted for Approval!\n\n"${formData.title}" has been updated and sent to admin for review.${hasFiles ? '\n\n📁 Images and documents have been updated.' : ''}\n\n⏳ Your changes are now pending admin approval. You'll be notified once reviewed.`;
        } else {
          successMessage = `🎉 Project Updated Successfully!\n\n"${formData.title}" has been updated and is ready for review.${hasFiles ? '\n\n📁 Images and documents have been updated.' : ''}\n\n✅ Next Step: Click "Submit for Review" to send to admin for approval.`;
        }
      } else {
        successMessage = `🎉 Project Created Successfully!\n\n"${formData.title}" has been saved as a draft.${hasFiles ? '\n\n📁 Images and documents have been uploaded.' : ''}\n\n✅ Next Step: Click "Submit for Review" when you're ready for admin approval.`;
      }
      
      alert(successMessage);
      
    } catch (error) {
      console.error('Failed to create project:', error);
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Log additional debug information
      console.error('Debug info:', {
        userInfo: userInfo,
        formData: formData,
        token: token ? 'present' : 'missing',
        error: error
      });
      
      alert(`❌ Project Creation Failed\n\n${errorMessage}\n\nPlease check the browser console for technical details and try again.`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSubmitForReview = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Validate required information before submission
      const validationErrors = [];
      
      if (!project.title?.trim()) validationErrors.push('Project title');
      if (!project.description?.trim()) validationErrors.push('Project description');
      if (!project.industry) validationErrors.push('Industry');
      if (!project.funding_goal || project.funding_goal <= 0) validationErrors.push('Funding goal');
      if (!project.location?.trim()) validationErrors.push('Location');
      if (!project.team_size || project.team_size <= 0) validationErrors.push('Team size');
      
      // Image is recommended but not required for submission
      const missingImage = !project.image_url;
      
      if (validationErrors.length > 0) {
        alert(`❌ Please complete the following required fields before submitting:\n\n• ${validationErrors.join('\n• ')}\n\n${missingImage ? '\n⚠️ Note: Adding a project image is highly recommended for better visibility!' : ''}`);
        return;
      }

      // Show warning if no image but allow submission
      if (missingImage) {
        const proceed = confirm(`⚠️ Submit without project image?\n\nYour project doesn't have an image yet. Projects with images get 3x more views!\n\n✅ Click OK to submit anyway\n❌ Click Cancel to add an image first`);
        if (!proceed) {
          alert('💡 Tip: Click "Edit" to add a project image, then submit for review!');
          return;
        }
      }

      console.log(`[PROJECT SUBMIT] Submitting project ${projectId} for review`);
      const response = await api.put(`/projects/${projectId}/submit`);
      
      if (response.error) {
        console.error(`[PROJECT SUBMIT] Failed to submit project ${projectId}:`, response.error);
        alert(`❌ Failed to submit project: ${response.error}`);
        return;
      }
      
      console.log(`[PROJECT SUBMIT] Successfully submitted project ${projectId}`);
      
      // Show success message with clear expectations
      const successMessage = missingImage 
        ? '🎉 Project Submitted for Review!\n\n📋 Status: Under Review\n⚠️ Note: Consider adding an image to improve approval chances\n\n⏱️ What\'s Next: Our admin team will review your project and notify you of the decision. You can track progress in your dashboard.'
        : '🎉 Project Submitted for Review Successfully!\n\n📋 Status: Under Review\n📁 All files included\n\n⏱️ What\'s Next: Our admin team will review your project and notify you of the decision. You can track progress in your dashboard.';
      
      alert(successMessage);
      
      // Refresh projects list
      await fetchProjects();
      
    } catch (error) {
      console.error('Failed to submit project for review:', error);
      alert('❌ Failed to submit project for review. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'funded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProjectForModal(project);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedProjectForModal(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Convert project data to ProjectCard format with enhanced image handling
  const convertToCardFormat = (project: Project) => {
    // Enhanced image URL handling with debugging
    let imageUrl = project.image_url || project.logo_url || project.image;
    
    // Construct full URL if it's a relative path
    if (imageUrl && !imageUrl.startsWith('http')) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://13.200.209.191:8080';
      imageUrl = `${backendUrl}${imageUrl}`;
    }
    
    console.log(`[ProjectOwner] Image URL for ${project.title}: ${imageUrl}`);
    
    return {
      title: project.title,
      description: project.description,
      fundRaised: formatCurrency(project.current_funding || 0),
      stage: project.project_stage || 'Early Stage',
      tags: project.tags 
        ? Array.isArray(project.tags) 
          ? project.tags 
          : project.tags.split(',').map(tag => tag.trim())
        : [project.industry],
      progress: project.progress_percentage || 0,
      rating: project.average_rating || 0,
      image: imageUrl,
      status: project.status,
      id: project.id
    };
  };


  const handleEditProject = (projectId: string) => {
    const projectToEdit = projects.find(p => p.id === projectId);
    if (!projectToEdit) {
      alert('Project not found!');
      return;
    }
    
    // Populate form with project data for editing
    console.log('ProjectOwner: Editing project', projectToEdit);
    
    setFormData({
      title: projectToEdit.title || '',
      description: projectToEdit.description || '',
      industry: projectToEdit.industry || '',
      project_stage: projectToEdit.project_stage || 'idea',
      funding_goal: projectToEdit.funding_goal?.toString() || '',
      funding_from_other_sources: projectToEdit.funding_from_other_sources?.toString() || '0',
      location: projectToEdit.location || '',
      team_size: projectToEdit.team_size?.toString() || '1',
      valuation: projectToEdit.valuation?.toString() || '',
      tags: Array.isArray(projectToEdit.tags) ? projectToEdit.tags : 
            typeof projectToEdit.tags === 'string' ? projectToEdit.tags.split(',').map(t => t.trim()) : []
    });
    
    setEditingProjectId(projectId);
    setSelectedFiles({}); // Clear any previously selected files
    setExistingImageUrl(projectToEdit.image_url || projectToEdit.logo_url || null); // Set existing image
    setShowCreateForm(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'submitted': case 'under_review': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['project_owner']} requireApproval={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your projects...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['project_owner']} requireApproval={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <img
                    src="/Zuvomo New Logo/zuvomo_06.png"
                    alt="Zuvomo Logo"
                    className="h-8 w-auto object-contain"
                  />
                </a>
                <span className="ml-3 text-sm text-gray-500">Project Owner Dashboard</span>
              </div>
              <div className="flex items-center space-x-4">
                <Dialog open={showCreateForm} onOpenChange={(open) => {
                  setShowCreateForm(open);
                  if (!open) {
                    setEditingProjectId(null);
                    setFormData({
                      title: '',
                      description: '',
                      industry: '',
                      funding_goal: '',
                      funding_from_other_sources: '0',
                      location: '',
                      team_size: '1',
                      project_stage: 'idea',
                      valuation: '',
                      tags: []
                    });
                    setValidationErrors({});
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProjectId ? 'Edit Project' : 'Create New Project'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Project Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="Enter your project title"
                            maxLength={100}
                            className={validationErrors.title ? 'border-red-500' : ''}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.title.length}/100 characters (minimum 5 required)
                          </p>
                          {validationErrors.title && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.title}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="description">Project Description *</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe your project in detail - explain what you're building, your vision, target market, and what makes it unique..."
                            rows={6}
                            maxLength={2000}
                            className={validationErrors.description ? 'border-red-500' : ''}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formData.description.length}/2000 characters (minimum 50 required)
                          </p>
                          {validationErrors.description && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.description}</p>
                          )}
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="industry">Industry *</Label>
                            <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                              <SelectTrigger className={validationErrors.industry ? 'border-red-500' : ''}>
                                <SelectValue placeholder="Select industry" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Blockchain">Blockchain</SelectItem>
                                <SelectItem value="AI">AI</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="E-commerce">E-commerce</SelectItem>
                                <SelectItem value="Gaming">Gaming</SelectItem>
                                <SelectItem value="Real Estate">Real Estate</SelectItem>
                                <SelectItem value="Energy">Energy</SelectItem>
                                <SelectItem value="Food Tech">Food Tech</SelectItem>
                              </SelectContent>
                            </Select>
                            {validationErrors.industry && (
                              <p className="text-red-500 text-sm mt-1">{validationErrors.industry}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="project_stage">Project Stage</Label>
                            <Select value={formData.project_stage} onValueChange={(value) => handleInputChange('project_stage', value)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="idea">Idea</SelectItem>
                                <SelectItem value="prototype">Prototype</SelectItem>
                                <SelectItem value="mvp">MVP</SelectItem>
                                <SelectItem value="early_revenue">Early Revenue</SelectItem>
                                <SelectItem value="growth">Growth</SelectItem>
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
                            placeholder="City, Country"
                            className={validationErrors.location ? 'border-red-500' : ''}
                          />
                          {validationErrors.location && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.location}</p>
                          )}
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="funding_goal">Funding Goal (USD) *</Label>
                          <Input
                            id="funding_goal"
                            type="number"
                            value={formData.funding_goal}
                            onChange={(e) => handleInputChange('funding_goal', e.target.value)}
                            placeholder="e.g., 100000"
                            className={validationErrors.funding_goal ? 'border-red-500' : ''}
                          />
                          {validationErrors.funding_goal && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.funding_goal}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="funding_from_other_sources">Funding Saved from Other Sources (USD)</Label>
                          <Input
                            id="funding_from_other_sources"
                            type="number"
                            value={formData.funding_from_other_sources}
                            onChange={(e) => handleInputChange('funding_from_other_sources', e.target.value)}
                            placeholder="e.g., 50000 (enter 0 if none)"
                            className={validationErrors.funding_from_other_sources ? 'border-red-500' : ''}
                          />
                          {validationErrors.funding_from_other_sources && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.funding_from_other_sources}</p>
                          )}
                        </div>


                        <div>
                          <Label htmlFor="valuation">Company Valuation (USD)</Label>
                          <Input
                            id="valuation"
                            type="number"
                            value={formData.valuation}
                            onChange={(e) => handleInputChange('valuation', e.target.value)}
                            placeholder="e.g., 1000000"
                          />
                          <p className="text-sm text-gray-500 mt-1">Optional: Current company valuation</p>
                        </div>

                        <div>
                          <Label htmlFor="team_size">Team Size *</Label>
                          <Input
                            id="team_size"
                            type="number"
                            min="1"
                            value={formData.team_size}
                            onChange={(e) => handleInputChange('team_size', e.target.value)}
                            className={validationErrors.team_size ? 'border-red-500' : ''}
                          />
                          {validationErrors.team_size && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.team_size}</p>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Tags Selection */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <span className="text-blue-600 mr-2">#</span>
                        Project Tags *
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">Select tags that best describe your project (choose at least one)</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Finance', 'Blockchain', 'AI', 'Healthcare', 'Education', 
                          'E-commerce', 'Gaming', 'Real Estate', 'Energy', 'Food Tech',
                          'Arbitrum', 'Infrastructure', 'Bitcoin L2', 'Binance', 'Ethereum',
                          'DeFi', 'Solana', 'Artificial Intelligence', 'Blockchain Service'
                        ].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleTagSelect(tag)}
                            className={`
                              px-4 py-2 text-sm rounded-full border transition-all duration-200
                              ${formData.tags.includes(tag)
                                ? 'bg-[#2C91D5] text-white border-[#2C91D5]'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-[#2C91D5] hover:text-[#2C91D5]'
                              }
                            `}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      
                      {validationErrors.tags && (
                        <p className="text-red-500 text-sm mt-2">{validationErrors.tags}</p>
                      )}
                      
                      {formData.tags.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700 mb-2">Selected tags:</p>
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-3 py-1 text-xs bg-[#2C91D5] text-white rounded-full"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleTagSelect(tag)}
                                  className="ml-2 hover:bg-blue-600 rounded-full p-0.5"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Simplified File Upload Section */}
                    <div className="border-t pt-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-blue-600" />
                        Project Files (Optional)
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-4">Upload key files to showcase your project</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Project Logo/Image Upload */}
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Project Logo/Image {editingProjectId ? '(Optional - Current image will be kept if none selected)' : '*'}</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2C91D5] transition-colors">
                            {selectedFiles.main_image ? (
                              <div className="space-y-3">
                                {/* Image Preview */}
                                <div className="w-32 h-32 mx-auto rounded-lg overflow-hidden bg-gray-100 border-2 border-green-500">
                                  <img 
                                    src={URL.createObjectURL(selectedFiles.main_image)} 
                                    alt="Project image preview" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400">Preview unavailable</div>';
                                    }}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600 truncate">
                                    {selectedFiles.main_image.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSelectedFile('main_image')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                  ✓ Image ready to upload • {(selectedFiles.main_image.size / 1024 / 1024).toFixed(1)}MB
                                </div>
                              </div>
                            ) : editingProjectId && existingImageUrl ? (
                              <div className="space-y-3">
                                <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden bg-gray-100">
                                  <img 
                                    src={existingImageUrl} 
                                    alt="Current project image" 
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-sm">Image not found</div>';
                                    }}
                                  />
                                </div>
                                <p className="text-sm text-blue-600 font-medium">Current Image</p>
                                <p className="text-xs text-gray-500">Upload a new image to replace this one</p>
                              </div>
                            ) : (
                              <div>
                                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                                <input
                                  type="file"
                                  accept="image/png,image/jpg,image/jpeg,image/webp"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect('main_image', file);
                                  }}
                                  className="hidden"
                                  id="main_image_upload"
                                />
                                <label
                                  htmlFor="main_image_upload"
                                  className="cursor-pointer text-sm text-gray-600 hover:text-[#2C91D5] block text-center"
                                >
                                  <span className="font-medium text-lg text-blue-600">📷 Click to upload project image</span>
                                  <br />
                                  <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</span>
                                  <br />
                                  <span className="text-xs text-blue-500 mt-2 bg-blue-50 px-2 py-1 rounded-full inline-block">
                                    Recommended: 400x300px
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg text-xs space-y-1">
                            <p className="font-medium text-blue-800">📐 Image Guidelines:</p>
                            <p className="text-blue-700">• Recommended: 400x200px (2:1 ratio)</p>
                            <p className="text-blue-700">• Format: PNG, JPG, or WEBP</p>
                            <p className="text-blue-700">• Max size: 5MB</p>
                            <p className="text-blue-700">• High quality, clear branding</p>
                          </div>
                        </div>

                        {/* Pitch Deck Upload */}
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Pitch Deck *</Label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#2C91D5] transition-colors">
                            {selectedFiles.pitch_deck ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600 truncate">
                                    {selectedFiles.pitch_deck.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSelectedFile('pitch_deck')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                  ✓ Size: {(selectedFiles.pitch_deck.size / 1024 / 1024).toFixed(1)}MB
                                </div>
                              </div>
                            ) : (
                              <div>
                                <FileText className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                                <input
                                  type="file"
                                  accept=".pdf,.ppt,.pptx"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect('pitch_deck', file);
                                  }}
                                  className="hidden"
                                  id="pitch_deck_upload"
                                />
                                <label
                                  htmlFor="pitch_deck_upload"
                                  className="cursor-pointer text-sm text-gray-600 hover:text-[#2C91D5]"
                                >
                                  <span className="font-medium">Click to upload pitch deck</span>
                                  <br />
                                  <span className="text-xs text-gray-400">PDF, PPT up to 10MB</span>
                                </label>
                              </div>
                            )}
                          </div>
                          <div className="bg-blue-50 p-3 rounded-lg text-xs space-y-1">
                            <p className="font-medium text-blue-800">📄 Pitch Deck Guidelines:</p>
                            <p className="text-blue-700">• Format: PDF, PPT, or PPTX</p>
                            <p className="text-blue-700">• Max size: 10MB</p>
                            <p className="text-blue-700">• 10-15 slides recommended</p>
                            <p className="text-blue-700">• Include: Problem, Solution, Market, Business Model</p>
                          </div>
                        </div>
                      </div>
                      
                      {Object.keys(selectedFiles).length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700">
                            <FileText className="w-4 h-4 inline mr-1" />
                            {Object.keys(selectedFiles).length} file(s) selected for upload
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setValidationErrors({});
                          setEditingProjectId(null);
                          setExistingImageUrl(null);
                          setSelectedFiles({});
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateProject}
                        disabled={createLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {createLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            {editingProjectId ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            {editingProjectId ? 'Update Project' : 'Create Project'}
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                My Projects
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">All your projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <p className="text-xs text-muted-foreground">Approved & live</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Under Review</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(stats.totalFunding)}
                    </div>
                    <p className="text-xs text-muted-foreground">From all projects</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Status Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Project
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('projects')}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Manage Projects ({stats.total})
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('analytics')}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Project Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{stats.approved}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-gray-100 text-gray-800">
                            <Edit className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        </div>
                        <span className="text-2xl font-bold text-gray-600">{stats.draft}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        </div>
                        <span className="text-2xl font-bold text-red-600">{stats.rejected}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Projects Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  {projects.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                      <p className="text-gray-500 mb-4">
                        Get started by creating your first project to raise funding.
                      </p>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowCreateForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Project
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {projects.slice(0, 3).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-gray-900">{project.title}</h3>
                              {project.is_featured && (
                                <Badge className="bg-yellow-500">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">{project.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-gray-600">
                                Goal: {formatCurrency(project.funding_goal)}
                              </span>
                              <span className="text-gray-600">
                                Raised: {formatCurrency(project.current_funding)}
                              </span>
                              <span className="text-gray-600">
                                {(project.progress_percentage || 0).toFixed(1)}% funded
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all" 
                                style={{ width: `${Math.min(project.progress_percentage || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 ml-4">
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1">{project.status.charAt(0).toUpperCase() + project.status.slice(1).replace('_', ' ')}</span>
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedProject(project)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {projects.length > 3 && (
                        <div className="text-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab('projects')}
                          >
                            View All {projects.length} Projects
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
                  <p className="text-gray-600">Manage all your funding projects</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search projects..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                </div>
              </div>

              {/* Projects Grid with Status Filters */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                  {['all', 'draft', 'submitted', 'approved', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={searchTerm === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSearchTerm(status === 'all' ? '' : status)}
                      className={`capitalize ${
                        searchTerm === status ? 'bg-[#2C91D5] text-white' : 'hover:bg-[#2C91D5] hover:text-white'
                      }`}
                    >
                      {status === 'all' ? 'All Projects' : status}
                      <span className="ml-2 bg-white bg-opacity-20 px-1.5 py-0.5 rounded text-xs">
                        {status === 'all' 
                          ? projects.length 
                          : projects.filter(p => p.status === status).length
                        }
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {filteredProjects.length === 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchTerm ? 'No projects found' : 'No projects yet'}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchTerm ? 'Try adjusting your filter' : 'Create your first project to get started'}
                      </p>
                      {!searchTerm && (
                        <Button 
                          className="bg-[#2C91D5] hover:bg-blue-700"
                          onClick={() => setShowCreateForm(true)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Project
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project, index) => {
                    const projectCardProps = convertToCardFormat(project);

                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="relative group"
                      >
                        <div className="relative">
                          <ProjectCard 
                            {...projectCardProps} 
                            onViewDetails={() => setSelectedProject(project)}
                          />
                          
                          {/* Status Badge Overlay */}
                          <div className="absolute top-4 right-4 z-10">
                            <Badge className={getStatusColor(project.status)}>
                              {getStatusIcon(project.status)}
                              <span className="ml-1">{project.status.replace('_', ' ')}</span>
                            </Badge>
                          </div>
                          
                          {/* Featured Badge */}
                          {project.is_featured && (
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className="bg-yellow-500">
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            </div>
                          )}
                          
                          
                          {/* Admin Feedback Overlay */}
                          {(project.admin_notes || project.rejected_reason) && (
                            <div className="absolute bottom-16 left-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {project.admin_notes && (
                                <div className="bg-blue-100/95 backdrop-blur-sm p-2 rounded-lg text-xs mb-2 border border-blue-200">
                                  <strong>Admin Notes:</strong> {project.admin_notes}
                                </div>
                              )}
                              {project.rejected_reason && (
                                <div className="bg-red-100/95 backdrop-blur-sm p-2 rounded-lg text-xs border border-red-200">
                                  <strong>Rejection Reason:</strong> {project.rejected_reason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
                  <p className="text-gray-600">Track your project performance</p>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Funding Goal</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(projects.reduce((sum, p) => sum + p.funding_goal, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">Across all projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(isNaN(stats.avgProgress) ? 0 : stats.avgProgress || 0).toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">Funding progress</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.total > 0 ? (isNaN((stats.approved / stats.total) * 100) ? 0 : ((stats.approved / stats.total) * 100)).toFixed(1) : '0.0'}%
                    </div>
                    <p className="text-xs text-muted-foreground">Approval rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projects.length > 0 ? 
                        (isNaN(projects.reduce((sum, p) => sum + (p.average_rating || 0), 0) / projects.length) ? 0 : (projects.reduce((sum, p) => sum + (p.average_rating || 0), 0) / projects.length)).toFixed(1) : 
                        '0.0'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">Average project rating</p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projects.slice(0, 5).map((project) => (
                        <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{project.title}</h4>
                            <p className="text-sm text-gray-500">{project.industry}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{(project.progress_percentage || 0).toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">{formatCurrency(project.current_funding)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Categories Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from(new Set(projects.map(p => p.industry))).map((industry) => {
                        const industryProjects = projects.filter(p => p.industry === industry);
                        const totalFunding = industryProjects.reduce((sum, p) => sum + p.current_funding, 0);
                        return (
                          <div key={industry} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{industry}</p>
                              <p className="text-sm text-gray-500">{industryProjects.length} projects</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(totalFunding)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Enhanced Project Details Modal with Tabs */}
          {selectedProject && (
            <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
              <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
                <DialogHeader className="pb-4 border-b">
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl font-bold">{selectedProject.title}</span>
                      <div className="flex items-center space-x-2">
                        {selectedProject.is_featured && (
                          <Badge className="bg-yellow-500">
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        <Badge className={getStatusColor(selectedProject.status)}>
                          {getStatusIcon(selectedProject.status)}
                          <span className="ml-1">{selectedProject.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <Tabs defaultValue="overview" className="h-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="funding">Funding</TabsTrigger>
                    <TabsTrigger value="files">Files & Media</TabsTrigger>
                    <TabsTrigger value="ratings">Ratings & Feedback</TabsTrigger>
                  </TabsList>
                  
                  <div className="overflow-y-auto max-h-[calc(95vh-200px)] mt-4">
                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Project Image */}
                        <div className="space-y-4">
                          {selectedProject.image_url ? (
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={selectedProject.image_url} 
                                alt={selectedProject.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                              <div className="text-4xl font-bold text-blue-200">
                                {selectedProject.title.charAt(0)}
                              </div>
                            </div>
                          )}
                          
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Description</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{selectedProject.description}</p>
                          </div>
                        </div>
                        
                        {/* Project Details */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Project Information</h3>
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Category:</span>
                                <span className="font-medium">{selectedProject.industry}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Stage:</span>
                                <span className="font-medium capitalize">{selectedProject.project_stage}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Location:</span>
                                <span className="font-medium">{selectedProject.location}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Team Size:</span>
                                <span className="font-medium">{selectedProject.team_size} people</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100">
                                <span className="text-gray-500">Created:</span>
                                <span className="font-medium">{formatDate(selectedProject.created_at)}</span>
                              </div>
                              <div className="flex justify-between py-2">
                                <span className="text-gray-500">Last Updated:</span>
                                <span className="font-medium">{formatDate(selectedProject.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {selectedProject.tags && (
                            <div>
                              <h4 className="font-medium mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {(Array.isArray(selectedProject.tags) 
                                  ? selectedProject.tags 
                                  : typeof selectedProject.tags === 'string' 
                                    ? selectedProject.tags.split(',').map(tag => tag.trim())
                                    : []
                                ).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Admin Feedback */}
                      {(selectedProject.admin_notes || selectedProject.rejected_reason) && (
                        <div className="space-y-4">
                          {selectedProject.admin_notes && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center">
                                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                Admin Notes
                              </h4>
                              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                <p className="text-sm text-blue-800">{selectedProject.admin_notes}</p>
                              </div>
                            </div>
                          )}
                          
                          {selectedProject.rejected_reason && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center">
                                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                Rejection Reason
                              </h4>
                              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                                <p className="text-sm text-red-800">{selectedProject.rejected_reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="funding" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Funding Overview</h3>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(selectedProject.current_funding)}
                              </span>
                              <span className="text-sm text-gray-600">
                                of {formatCurrency(selectedProject.funding_goal)}
                              </span>
                            </div>
                            <Progress value={selectedProject.progress_percentage || 0} className="h-3 mb-2" />
                            <div className="text-center text-sm font-medium text-blue-700">
                              {(selectedProject.progress_percentage || 0).toFixed(1)}% Funded
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Financial Details</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between py-3 border-b border-gray-100">
                              <span className="text-gray-600">Funding Goal:</span>
                              <span className="font-semibold text-green-600">{formatCurrency(selectedProject.funding_goal)}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-100">
                              <span className="text-gray-600">Current Funding:</span>
                              <span className="font-semibold">{formatCurrency(selectedProject.current_funding)}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-100">
                              <span className="text-gray-600">From Other Sources:</span>
                              <span className="font-semibold">{formatCurrency(selectedProject.funding_from_other_sources || 0)}</span>
                            </div>
                            <div className="flex justify-between py-3 border-b border-gray-100">
                              <span className="text-gray-600">Equity Offered:</span>
                              <span className="font-semibold">{selectedProject.equity_percentage}%</span>
                            </div>
                            {selectedProject.valuation && (
                              <div className="flex justify-between py-3">
                                <span className="text-gray-600">Company Valuation:</span>
                                <span className="font-semibold">{formatCurrency(selectedProject.valuation)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="files" className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Project Files & Media</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Project Image */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2 flex items-center">
                              <Upload className="w-4 h-4 mr-2" />
                              Project Image
                            </h4>
                            {selectedProject.image_url ? (
                              <div className="space-y-2">
                                <img 
                                  src={selectedProject.image_url} 
                                  alt={selectedProject.title}
                                  className="w-full h-32 object-cover rounded border"
                                />
                                <p className="text-xs text-green-600">✓ Image uploaded</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No image uploaded</p>
                            )}
                          </div>
                          
                          {/* Pitch Deck */}
                          <div className="border rounded-lg p-4">
                            <h4 className="font-medium mb-2 flex items-center">
                              <FileText className="w-4 h-4 mr-2" />
                              Pitch Deck
                            </h4>
                            {selectedProject.pitch_deck_url ? (
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                  <FileText className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm">Pitch Deck.pdf</span>
                                </div>
                                <p className="text-xs text-green-600">✓ Pitch deck uploaded</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No pitch deck uploaded</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="ratings" className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Ratings & Investor Feedback</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Rating Overview */}
                          <div className="border rounded-lg p-6">
                            <h4 className="font-medium mb-4">Overall Rating</h4>
                            <div className="text-center space-y-2">
                              <div className="text-3xl font-bold text-yellow-600">
                                {(selectedProject.average_rating || 0).toFixed(1)}/5
                              </div>
                              <div className="flex justify-center space-x-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star}
                                    className={`w-5 h-5 ${
                                      star <= (selectedProject.average_rating || 0) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-sm text-gray-600">
                                Based on {selectedProject.rating_count || 0} rating(s)
                              </p>
                            </div>
                          </div>
                          
                          {/* Recent Feedback */}
                          <div className="border rounded-lg p-6">
                            <h4 className="font-medium mb-4">Recent Feedback</h4>
                            {selectedProject.status === 'approved' ? (
                              <div className="space-y-3">
                                <div className="text-sm text-gray-600">
                                  Feedback will appear here once investors start rating your project.
                                </div>
                                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                                  💡 Your project is live and available for investor review!
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-600">
                                Ratings and feedback will be available once your project is approved and live.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                  
                  {/* Action Footer */}
                  <div className="flex flex-col space-y-4 pt-6 border-t mt-6">
                    {/* Project Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Edit/Update Action */}
                      {(selectedProject.status === 'draft' || selectedProject.status === 'rejected' || selectedProject.status === 'approved') && (
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            handleEditProject(selectedProject.id);
                            setSelectedProject(null);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {selectedProject.status === 'approved' ? 'Update' : 'Edit'}
                        </Button>
                      )}
                      
                      {/* Add/Change Image Action */}
                      <Button 
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          handleEditProject(selectedProject.id);
                          setSelectedProject(null);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {selectedProject.image_url ? 'Change Image' : 'Add Image'}
                      </Button>
                      
                      {/* Submit/Resubmit Action */}
                      {(selectedProject.status === 'draft' || selectedProject.status === 'rejected') && (
                        <Button 
                          className="bg-[#2C91D5] hover:bg-[#2C91D5]/90 flex-1"
                          onClick={() => handleSubmitForReview(selectedProject.id)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {selectedProject.status === 'rejected' ? 'Resubmit' : 'Submit'}
                        </Button>
                      )}
                      
                      {/* Status Display for Approved/Submitted */}
                      {(selectedProject.status === 'approved' || selectedProject.status === 'submitted') && (
                        <div className="flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded-md">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            {selectedProject.status === 'approved' ? 'Live' : 'Under Review'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Admin Feedback Section */}
                    {(selectedProject.admin_notes || selectedProject.rejected_reason) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Admin Feedback
                        </h4>
                        {selectedProject.admin_notes && (
                          <div className="mb-2">
                            <span className="text-sm font-medium text-blue-800">Notes:</span>
                            <p className="text-sm text-blue-700">{selectedProject.admin_notes}</p>
                          </div>
                        )}
                        {selectedProject.rejected_reason && (
                          <div>
                            <span className="text-sm font-medium text-red-800">Rejection Reason:</span>
                            <p className="text-sm text-red-700">{selectedProject.rejected_reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Close Button */}
                    <div className="flex justify-center pt-2">
                      <Button variant="outline" onClick={() => setSelectedProject(null)} className="px-8">
                        Close
                      </Button>
                    </div>
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}
        </main>
      </div>

      {/* Project Details Modal */}
      {selectedProjectForModal && (
        <ProjectDetailsModal
          project={{
            title: selectedProjectForModal.title,
            description: selectedProjectForModal.description,
            fundRaised: formatCurrency(selectedProjectForModal.current_funding || 0),
            stage: selectedProjectForModal.project_stage || 'Early Stage',
            tags: selectedProjectForModal.tags 
              ? Array.isArray(selectedProjectForModal.tags) 
                ? selectedProjectForModal.tags 
                : selectedProjectForModal.tags.split(',').map(tag => tag.trim())
              : [selectedProjectForModal.industry],
            progress: selectedProjectForModal.progress_percentage || 0,
            rating: selectedProjectForModal.average_rating || 0,
            image: selectedProjectForModal.image_url || selectedProjectForModal.logo_url || selectedProjectForModal.image,
            // Additional details for comprehensive modal
            id: selectedProjectForModal.id,
            location: selectedProjectForModal.location || 'Location not specified',
            teamSize: selectedProjectForModal.team_size || 1,
            fundingGoal: formatCurrency(selectedProjectForModal.funding_goal || 0),
            industry: selectedProjectForModal.industry || 'Technology',
            valuation: formatCurrency(selectedProjectForModal.valuation || 0),
            ownerName: 'Project Owner', // TODO: Get from backend
            ownerCompany: 'Company Name', // TODO: Get from backend
            ratingCount: 10 // TODO: Get from backend
          }}
          isOpen={showDetailsModal}
          onClose={handleCloseModal}
        />
      )}
    </ProtectedRoute>
  );
};

export default ProjectOwnerDashboard;