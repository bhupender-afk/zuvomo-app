import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import {
  Users,
  FileText,
  BarChart3,
  Settings,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Star,
  Calendar,
  TrendingUp,
  Activity,
  UserCheck,
  AlertTriangle,
  DollarSign,
  PieChart,
  Clock,
  Menu,
  X,
  Bell,
  LogOut,
  Loader2,
  Trash2
} from 'lucide-react';
import api from '../../services/api';
import AdminProjectEditForm from '../../components/AdminProjectEditForm';
import { AdminUserCreateForm } from '../../components/AdminUserCreateForm';
import BlogCreateForm from '../../components/BlogCreateForm';
import BlogEditForm from '../../components/BlogEditForm';
import BlogViewModal from '../../components/BlogViewModal';
import CaseStudyCreateForm from '../../components/CaseStudyCreateForm';
import CaseStudyEditForm from '../../components/CaseStudyEditForm';
import CaseStudyViewModal from '../../components/admin/CaseStudyViewModal';
import UserManagementTable from '../../components/UserManagementTable';
import AdminOverviewTab from '../../components/admin/AdminOverviewTab';
import AdminStatsCard from '../../components/admin/AdminStatsCard';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, formatDate, getStatusColor } from '@/utils/adminHelpers';

interface AdminStats {
  project_counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    draft: number;
    under_review: number;
    funded: number;
    completed: number;
  };
  funding_stats: {
    total_projects: number;
    total_funding_goal: number;
    total_current_funding: number;
    avg_progress: string;
  };
  recent_activity: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    first_name: string;
    last_name: string;
    company: string;
    owner_name: string;
  }>;
  category_breakdown: Array<{
    category: string;
    count: number;
    total_funding: number;
  }>;
}

interface Project {
  id: string;
  title: string;
  short_description: string;
  category: string;
  funding_goal: number;
  current_funding: number;
  minimum_investment: number;
  equity_percentage: number;
  location: string;
  team_size: number;
  project_stage: string;
  status: string;
  image_url?: string;
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
  owner_id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  days_since_submission: number;
}

interface User {
  id: number;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  company?: string;
  location?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  last_login?: string;
  profile_completed: boolean;
  kyc_verified: boolean;
  accredited_investor: boolean;
}

interface ProjectFilters {
  search: string;
  status: string;
  category: string;
  sort: string;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
  sort: string;
}

const AdminDashboard: React.FC = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [projectFilters, setProjectFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all', // Use 'all' instead of empty string
    category: 'all', // Use 'all' instead of empty string
    sort: 'created_at'
  });
  const [userFilters, setUserFilters] = useState<UserFilters>({
    search: '',
    role: 'all', // Use 'all' instead of empty string
    status: 'all', // Use 'all' instead of empty string
    sort: 'created_at'
  });
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  
  // Blog and Case Study state
  const [blogs, setBlogs] = useState([]);
  const [caseStudies, setCaseStudies] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [caseStudiesLoading, setCaseStudiesLoading] = useState(false);
  const [showCreateBlog, setShowCreateBlog] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [showEditBlog, setShowEditBlog] = useState(false);
  const [showViewBlog, setShowViewBlog] = useState(false);
  const [showCreateCaseStudy, setShowCreateCaseStudy] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<any>(null);
  const [showEditCaseStudy, setShowEditCaseStudy] = useState(false);
  const [showViewCaseStudy, setShowViewCaseStudy] = useState(false);
  const [userRefreshTrigger, setUserRefreshTrigger] = useState(0);
  const [blogStats, setBlogStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
    views: 0
  });
  const [caseStudyStats, setCaseStudyStats] = useState({
    total: 0,
    published: 0,
    industries: 0,
    views: 0
  });

  // Search and filter states for blogs and case studies
  const [blogFilters, setBlogFilters] = useState({
    search: '',
    status: 'all',
    featured: 'all'
  });
  const [caseStudyFilters, setCaseStudyFilters] = useState({
    search: '',
    status: 'all',
    industry: 'all'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('AdminDashboard: Starting data fetch');
        setLoading(true);
        
        // Fetch admin statistics from working endpoint
        console.log('AdminDashboard: Fetching admin stats');
        const statsResponse = await api.get('/admin/stats');
        console.log('AdminDashboard: Admin stats response', statsResponse);
        
        if (statsResponse.data) {
          setStats(statsResponse.data);
          console.log('AdminDashboard: Stats loaded successfully', statsResponse.data);
        } else {
          console.error('AdminDashboard: Failed to load stats', statsResponse.error);
          // Set default stats structure matching the backend response
          setStats({
            project_counts: { total: 0, approved: 0, pending: 0, rejected: 0, draft: 0, under_review: 0, funded: 0, completed: 0, submitted: 0 },
            funding_stats: { 
              total_projects: 0, 
              total_funding_goal: 0, 
              total_current_funding: 0, 
              avg_progress: '0.0' 
            },
            recent_activity: [],
            category_breakdown: []
          });
        }
        
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch projects when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'projects' || activeTab === 'pending-reviews') {
      fetchProjects();
    }
  }, [activeTab, projectFilters]);

  // Fetch users when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, userFilters]);

  // Fetch blogs when tab changes
  useEffect(() => {
    if (activeTab === 'blogs') {
      fetchBlogs();
    }
  }, [activeTab]);

  // Fetch case studies when tab changes
  useEffect(() => {
    if (activeTab === 'case-studies') {
      fetchCaseStudies();
    }
  }, [activeTab]);

  // Debounced search for blogs
  useEffect(() => {
    if (activeTab === 'content') {
      const timeoutId = setTimeout(() => {
        fetchBlogs();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [blogFilters, activeTab]);

  // Debounced search for case studies
  useEffect(() => {
    if (activeTab === 'case-studies') {
      const timeoutId = setTimeout(() => {
        fetchCaseStudies();
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [caseStudyFilters, activeTab]);

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const params = new URLSearchParams();
      
      if (projectFilters.search) params.append('search', projectFilters.search);
      if (projectFilters.status && projectFilters.status !== 'all') params.append('status', projectFilters.status);
      if (projectFilters.category && projectFilters.category !== 'all') params.append('category', projectFilters.category);
      if (projectFilters.sort) params.append('sort', projectFilters.sort);
      params.append('limit', '50');

      // Use the working admin projects endpoint
      console.log('AdminDashboard: Fetching projects with params', params.toString());
      const response = await api.get(`/admin/projects?${params.toString()}`);
      console.log('AdminDashboard: Projects response', response);
        
      if (response.data && response.data.projects) {
        const projects = response.data.projects;
        console.log('AdminDashboard: Projects loaded successfully', projects.length);
        setProjects(projects);
      } else {
        console.error('AdminDashboard: Failed to fetch projects', response.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = new URLSearchParams();
      
      if (userFilters.search) params.append('search', userFilters.search);
      if (userFilters.role && userFilters.role !== 'all') params.append('role', userFilters.role);
      if (userFilters.status && userFilters.status !== 'all') params.append('status', userFilters.status);
      if (userFilters.sort) params.append('sort', userFilters.sort);
      params.append('limit', '50');

      console.log('AdminDashboard: Fetching users with params', params.toString());
      const response = await api.get(`/admin/users?${params.toString()}`);
      console.log('AdminDashboard: Users response', response);
      console.log('AdminDashboard: Raw response data:', response.data);
      console.log('AdminDashboard: Response data users:', response.data?.users);
      
      if (response.data && response.data.users) {
        // Map backend fields to frontend interface
        const users = response.data.users.map((user: any) => ({
          ...user,
          id: user.id,
          role: user.user_type, // Map user_type to role
          email_verified: user.is_verified, // Map is_verified to email_verified
          is_active: user.is_active !== undefined ? user.is_active : true,
          approval_status: user.approval_status || 'approved'
        }));
        console.log('AdminDashboard: Users loaded successfully', users.length, 'users:', users);
        setUsers(users);
      } else {
        console.error('AdminDashboard: Failed to fetch users. Error:', response.error);
        console.error('AdminDashboard: Response status:', response.status);
        console.error('AdminDashboard: Full response:', response);
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      setBlogsLoading(true);
      console.log('AdminDashboard: Fetching blogs with filters', blogFilters);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (blogFilters.search) queryParams.append('search', blogFilters.search);
      if (blogFilters.status !== 'all') queryParams.append('status', blogFilters.status);

      const response = await api.get(`/blogs/admin/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
      console.log('AdminDashboard: Blogs response', response);

      if (response.data && response.data.success) {
        const blogData = response.data.data?.blogs || [];
        setBlogs(blogData);
        // Update blog stats
        setBlogStats({
          total: blogData.length,
          published: blogData.filter((blog: any) => blog.status === 'published').length,
          drafts: blogData.filter((blog: any) => blog.status === 'draft').length,
          views: blogData.reduce((sum: number, blog: any) => sum + (blog.views || 0), 0)
        });
        console.log('AdminDashboard: Blog stats updated', { total: blogData.length, published: blogData.filter((blog: any) => blog.status === 'published').length });
      } else {
        console.error('AdminDashboard: Failed to fetch blogs', response.error);
        setBlogs([]);
        setBlogStats({ total: 0, published: 0, drafts: 0, views: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
      setBlogs([]);
      setBlogStats({ total: 0, published: 0, drafts: 0, views: 0 });
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchCaseStudies = async () => {
    try {
      setCaseStudiesLoading(true);
      console.log('AdminDashboard: Fetching case studies with filters', caseStudyFilters);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (caseStudyFilters.search) queryParams.append('search', caseStudyFilters.search);
      if (caseStudyFilters.status !== 'all') queryParams.append('status', caseStudyFilters.status);
      if (caseStudyFilters.industry !== 'all') queryParams.append('industry', caseStudyFilters.industry);

      const response = await api.get(`/case-studies/admin/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`);
      console.log('AdminDashboard: Case studies response', response);

      if (response.data && response.data.success) {
        const caseStudyData = response.data.data?.case_studies || [];
        setCaseStudies(caseStudyData);
        // Update case study stats
        const uniqueIndustries = new Set(caseStudyData.map((cs: any) => cs.industry).filter(Boolean));
        setCaseStudyStats({
          total: caseStudyData.length,
          published: caseStudyData.filter((cs: any) => cs.status === 'published').length,
          industries: uniqueIndustries.size,
          views: caseStudyData.reduce((sum: number, cs: any) => sum + (cs.views || 0), 0)
        });
        console.log('AdminDashboard: Case study stats updated', { total: caseStudyData.length, published: caseStudyData.filter((cs: any) => cs.status === 'published').length });
      } else {
        console.error('AdminDashboard: Failed to fetch case studies', response.error);
        setCaseStudies([]);
        setCaseStudyStats({ total: 0, published: 0, industries: 0, views: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch case studies:', error);
      setCaseStudies([]);
      setCaseStudyStats({ total: 0, published: 0, industries: 0, views: 0 });
    } finally {
      setCaseStudiesLoading(false);
    }
  };

  const approveProject = async (projectId: string, notes?: string) => {
    try {
      console.log('AdminDashboard: Approving project', projectId);
      const response = await api.put(`/admin/projects/${projectId}/approve`, {
        admin_notes: notes || adminNotes
      });
      console.log('AdminDashboard: Approve response', response);
      
      if (response.error) {
        alert(`❌ Failed to approve project: ${response.error}`);
        return;
      }
      
      // Show success message
      alert('✅ Project approved successfully! It will now appear on the homepage.');
      
      await fetchProjects();
      
      // Update stats
      const updatedResponse = await api.get('/admin/stats');
      if (updatedResponse.data) {
        setStats(updatedResponse.data);
      }
      
      setSelectedProject(null);
      setAdminNotes('');
    } catch (error) {
      console.error('AdminDashboard: Failed to approve project:', error);
      alert('❌ Failed to approve project. Please try again.');
    }
  };

  const rejectProject = async (projectId: string, reason: string, notes?: string) => {
    try {
      console.log('AdminDashboard: Rejecting project', projectId);
      const response = await api.put(`/admin/projects/${projectId}/reject`, {
        admin_notes: notes || adminNotes || reason
      });
      console.log('AdminDashboard: Reject response', response);
      
      if (response.error) {
        alert(`❌ Failed to reject project: ${response.error}`);
        return;
      }
      
      // Show success message
      alert('✅ Project rejected successfully. The project owner will be notified.');
      
      await fetchProjects();
      
      // Update stats
      const updatedResponse = await api.get('/admin/stats');
      if (updatedResponse.data) {
        setStats(updatedResponse.data);
      }
      
      setSelectedProject(null);
      setRejectionReason('');
      setAdminNotes('');
    } catch (error) {
      console.error('AdminDashboard: Failed to reject project:', error);
      alert('❌ Failed to reject project. Please try again.');
    }
  };

  const toggleFeatured = async (projectId: string, isFeatured: boolean) => {
    try {
      const response = await api.put(`/admin/projects/${projectId}/featured`, {
        is_featured: !isFeatured
      });
      
      if (response.error) {
        alert(`❌ Failed to update featured status: ${response.error}`);
        return;
      }
      
      alert(`✅ Project ${!isFeatured ? 'featured' : 'unfeatured'} successfully!`);
      await fetchProjects();
    } catch (error) {
      console.error('Failed to toggle featured status:', error);
      alert('❌ Failed to update featured status. Please try again.');
    }
  };

  const delistProject = async (projectId: string) => {
    try {
      console.log('AdminDashboard: Delisting project', projectId);
      const response = await api.put(`/admin/projects/${projectId}/reject`, {
        admin_notes: 'Project delisted from homepage by admin'
      });
      console.log('AdminDashboard: Delist response', response);
      
      if (response.error) {
        alert(`❌ Failed to delist project: ${response.error}`);
        return;
      }
      
      // Show success message
      alert('✅ Project delisted successfully. It has been removed from the homepage.');
      
      await fetchProjects();
      
      // Update stats
      const updatedResponse = await api.get('/admin/stats');
      if (updatedResponse.data) {
        setStats(updatedResponse.data);
      }
    } catch (error) {
      console.error('AdminDashboard: Failed to delist project:', error);
      alert('❌ Failed to delist project. Please try again.');
    }
  };


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'project_owner': return 'bg-blue-100 text-blue-800';
      case 'investor': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Admin Project Edit Handlers
  const handleProjectSave = async (updatedProject: Project) => {
    console.log('Project saved:', updatedProject);
    // Update the project in the local state
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    // Close edit mode and modal
    setIsEditingProject(false);
    setSelectedProject(null);
    // Refresh projects list to get latest data
    await fetchProjects();
    alert('✅ Project updated successfully!');
  };

  const handleProjectSaveAndApprove = async (updatedProject: Project) => {
    try {
      console.log('Project saved and approving:', updatedProject);
      // First save the changes (already done in the form)
      // Then approve the project
      await approveProject(updatedProject.id);
      // Close edit mode and modal
      setIsEditingProject(false);
      setSelectedProject(null);
      alert('✅ Project updated and approved successfully!');
    } catch (error) {
      console.error('Error in save and approve:', error);
      alert('❌ Failed to approve project after saving. Please try again.');
    }
  };

  const handleEditCancel = () => {
    setIsEditingProject(false);
    // Keep modal open, just exit edit mode
  };

  const startEditingProject = () => {
    setIsEditingProject(true);
  };

  // Blog and Case Study handlers
  const handleBlogCreated = (blog: any) => {
    console.log('Blog created:', blog);
    setShowCreateBlog(false);
    fetchBlogs(); // Refresh the blogs list
    alert('✅ Blog post created successfully!');
  };

  const handleCaseStudyCreated = (caseStudy: any) => {
    console.log('Case study created:', caseStudy);
    setShowCreateCaseStudy(false);
    fetchCaseStudies(); // Refresh the case studies list
    alert('✅ Case study created successfully!');
  };

  // Blog CRUD handlers
  const handleBlogEdit = (blog: any) => {
    setSelectedBlog(blog);
    setShowEditBlog(true);
  };

  const handleBlogView = (blog: any) => {
    setSelectedBlog(blog);
    setShowViewBlog(true);
  };

  const handleBlogUpdated = (updatedBlog: any) => {
    console.log('Blog updated:', updatedBlog);
    setShowEditBlog(false);
    setSelectedBlog(null);
    fetchBlogs(); // Refresh the blogs list
    alert('✅ Blog post updated successfully!');
  };

  const handleBlogDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/blogs/${blogId}`);
      if (response.data?.success) {
        fetchBlogs(); // Refresh the blogs list
        alert('✅ Blog post deleted successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to delete blog post');
      }
    } catch (error: any) {
      console.error('Blog deletion error:', error);
      alert(error.response?.data?.message || 'Failed to delete blog post. Please try again.');
    }
  };

  // Case Study CRUD handlers
  const handleCaseStudyEdit = (caseStudy: any) => {
    setSelectedCaseStudy(caseStudy);
    setShowEditCaseStudy(true);
  };

  const handleCaseStudyView = (caseStudy: any) => {
    setSelectedCaseStudy(caseStudy);
    setShowViewCaseStudy(true);
  };

  const handleCaseStudyUpdated = (updatedCaseStudy: any) => {
    console.log('Case study updated:', updatedCaseStudy);
    setShowEditCaseStudy(false);
    setSelectedCaseStudy(null);
    fetchCaseStudies(); // Refresh the case studies list
    alert('✅ Case study updated successfully!');
  };

  const handleCaseStudyDelete = async (caseStudyId: string) => {
    if (!confirm('Are you sure you want to delete this case study? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/case-studies/${caseStudyId}`);
      if (response.data?.success) {
        fetchCaseStudies(); // Refresh the case studies list
        alert('✅ Case study deleted successfully!');
      } else {
        throw new Error(response.data?.message || 'Failed to delete case study');
      }
    } catch (error: any) {
      console.error('Case study deletion error:', error);
      alert(error.response?.data?.message || 'Failed to delete case study. Please try again.');
    }
  };

  // Sidebar navigation items
  const navigationItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'pending-reviews',
      label: 'Pending Reviews',
      icon: Clock,
      badge: ((stats?.project_counts.pending || 0) + (stats?.project_counts?.submitted || 0) + (stats?.project_counts.under_review || 0)) > 0
        ? (stats?.project_counts.pending || 0) + (stats?.project_counts?.submitted || 0) + (stats?.project_counts.under_review || 0)
        : null
    },
    {
      id: 'projects',
      label: 'All Projects',
      icon: FileText,
      badge: null
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      badge: null
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: PieChart,
      badge: null
    },
    {
      id: 'blogs',
      label: 'Blog Posts',
      icon: FileText,
      badge: null
    },
    {
      id: 'case-studies',
      label: 'Case Studies',
      icon: Star,
      badge: null
    }
  ];


  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading admin dashboard...</p>
            <p className="text-xs text-gray-400 mt-2">If this takes too long, check browser console for errors</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-[#2C91D5]">Zuvomo</h1>
                <span className="ml-2 text-xs text-gray-500">Admin</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-[#2C91D5] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-3" />
                      {item.label}
                    </div>
                    {item.badge && (
                      <Badge className="bg-yellow-500 text-white" variant="secondary">
                        {item.badge}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="border-t border-gray-200 p-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-700 hover:bg-gray-100"
                onClick={logout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Navbar */}
          <header className="bg-white border-b border-gray-200 h-16">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden mr-4"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-4 h-4" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-500">Manage your platform</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Content will be rendered here based on activeTab */}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <AdminOverviewTab
                stats={stats}
                onTabChange={setActiveTab}
              />
            )}

            {/* Pending Reviews Tab */}
            {activeTab === 'pending-reviews' && (
              <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Pending Reviews</h2>
                  <p className="text-gray-600">Projects requiring admin attention: submissions, drafts, and recent updates</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {projects.filter(p => 
                    p.status === 'pending' || 
                    p.status === 'submitted' || 
                    p.status === 'under_review' ||
                    p.status === 'draft' ||
                    (p.status === 'rejected' && p.updated_at && new Date(p.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
                  ).length} Needs Review
                </Badge>
              </div>

              {/* Pending Projects Table */}
              <Card>
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Funding Goal</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.filter(p => 
                      p.status === 'pending' || 
                      p.status === 'submitted' || 
                      p.status === 'under_review' ||
                      p.status === 'pending_update' || // Include approved projects with pending updates
                      p.status === 'draft' || // Include drafts that might be ready for review
                      (p.status === 'rejected' && p.updated_at && new Date(p.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Recently updated rejected projects
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <div>
                            <p className="text-gray-500 mb-2">No pending reviews</p>
                            <p className="text-sm text-gray-400">
                              All submitted projects have been reviewed
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      projects
                        .filter(p => 
                          p.status === 'pending' || 
                          p.status === 'submitted' || 
                          p.status === 'under_review' ||
                          p.status === 'pending_update' || // Include approved projects with pending updates
                          p.status === 'draft' || // Include drafts that might be ready for review
                          (p.status === 'rejected' && p.updated_at && new Date(p.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Recently updated rejected projects
                        )
                        .map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                {/* Project Image */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  {project.image_url || project.logo_url ? (
                                    <img 
                                      src={project.image_url || project.logo_url}
                                      alt={project.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = '/placeholder.svg';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                      No img
                                    </div>
                                  )}
                                </div>
                                {/* Project Details */}
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium">{project.title}</p>
                                  </div>
                                  <p className="text-sm text-gray-500 line-clamp-1">{project.short_description}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{project.first_name} {project.last_name}</p>
                                {project.company && <p className="text-sm text-gray-500">{project.company}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{project.category}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(project.funding_goal)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{formatDate(project.created_at)}</p>
                                <p className="text-xs text-gray-500">{project.days_since_submission} days ago</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedProject(project)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => approveProject(project.id)}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedProject(project)}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </Card>
              </div>
            )}

            {/* Project Management Tab */}
            {activeTab === 'projects' && (
              <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
                  <p className="text-gray-600">Review, approve, and manage all projects</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {stats?.project_counts.pending || 0} Pending Review
                </Badge>
              </div>

              {/* Project Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    Search & Filters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search projects..."
                        value={projectFilters.search}
                        onChange={(e) => setProjectFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={projectFilters.status} onValueChange={(value) => setProjectFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={projectFilters.category} onValueChange={(value) => setProjectFilters(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {stats?.category_breakdown?.map((cat) => (
                          <SelectItem key={cat.category} value={cat.category}>{cat.category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={projectFilters.sort} onValueChange={(value) => setProjectFilters(prev => ({ ...prev, sort: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Latest</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="funding_goal">Funding Goal</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Table */}
              {projectsLoading ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex space-x-4">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Funding Goal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <div>
                              <p className="text-gray-500 mb-2">
                                {projectFilters.status === 'pending' 
                                  ? 'No pending projects found' 
                                  : `No ${projectFilters.status || ''} projects found`
                                }
                              </p>
                              {projectFilters.status === 'pending' && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                                  <p className="text-blue-700 mb-2">
                                    <strong>For testing:</strong> Pending projects require backend admin endpoints.
                                  </p>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setProjectFilters(prev => ({ ...prev, status: 'approved' }))}
                                  >
                                    View Approved Projects Instead
                                  </Button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium">{project.title}</p>
                                  {project.is_featured && (
                                    <Badge className="bg-yellow-500">
                                      <Star className="w-3 h-3" />
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-1">{project.short_description}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{project.first_name} {project.last_name}</p>
                                {project.company && <p className="text-sm text-gray-500">{project.company}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{project.category}</Badge>
                            </TableCell>
                            <TableCell>{formatCurrency(project.funding_goal)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{formatDate(project.created_at)}</p>
                                <p className="text-xs text-gray-500">{project.days_since_submission} days ago</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                {/* View Action */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedProject(project)}
                                  title="View Details"
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>

                                {/* Edit Action */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setIsEditingProject(true);
                                  }}
                                  title="Edit Project"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>

                                {/* Status-specific actions */}
                                {project.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                      onClick={() => approveProject(project.id)}
                                      title="Approve & Make Live"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setSelectedProject(project)}
                                      title="Reject Project"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}

                                {project.status === 'approved' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => toggleFeatured(project.id, project.is_featured)}
                                      title={project.is_featured ? "Remove Featured" : "Make Featured"}
                                    >
                                      <Star className={`w-3 h-3 ${project.is_featured ? 'fill-current text-yellow-500' : ''}`} />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-orange-600 hover:text-orange-700"
                                      onClick={() => delistProject(project.id)}
                                      title="Delist from Homepage"
                                    >
                                      <XCircle className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}

                                {project.status === 'draft' && (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => approveProject(project.id)}
                                    title="Approve & Make Live"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                )}

                                {project.status === 'rejected' && (
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => approveProject(project.id)}
                                    title="Reconsider & Approve"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  </div>
                </Card>
              )}
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
              <UserManagementTable refreshTrigger={userRefreshTrigger} />
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
                  <p className="text-gray-600">Detailed insights and metrics</p>
                </div>
              </div>

              {/* Funding Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.funding_stats.total_projects || 0}</div>
                    <p className="text-xs text-muted-foreground">Approved projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Funding Goal</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.funding_stats.total_funding_goal || 0)}</div>
                    <p className="text-xs text-muted-foreground">Total sought</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Funding</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.funding_stats.total_current_funding || 0)}</div>
                    <p className="text-xs text-muted-foreground">Currently raised</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.funding_stats.avg_progress || '0.0'}%</div>
                    <p className="text-xs text-muted-foreground">Platform average</p>
                  </CardContent>
                </Card>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.project_counts && Object.entries(stats.project_counts).map(([status, count]) => (
                        status !== 'total' && (
                          <div key={status} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(status)}>
                                {status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold">{count}</div>
                          </div>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.category_breakdown?.slice(0, 5).map((category) => (
                        <div key={category.category} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{category.category}</p>
                            <p className="text-sm text-gray-500">{category.count} projects</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(category.total_funding)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
              </div>
            )}

            {/* Blog Management Tab */}
            {activeTab === 'blogs' && (
              <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
                  <p className="text-gray-600">Create and manage blog posts</p>
                </div>
                <Button 
                  className="bg-[#2C91D5] hover:bg-blue-700"
                  onClick={() => setShowCreateBlog(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Create New Post
                </Button>
              </div>

              {/* Blog Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{blogStats.total}</div>
                    <p className="text-xs text-muted-foreground">All blog posts</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{blogStats.published}</div>
                    <p className="text-xs text-muted-foreground">Live posts</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                    <Edit className="h-4 w-4 text-yellow-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{blogStats.drafts}</div>
                    <p className="text-xs text-muted-foreground">In progress</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{blogStats.views}</div>
                    <p className="text-xs text-muted-foreground">All time views</p>
                  </CardContent>
                </Card>
              </div>

              {/* Blog Management Interface */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Blog Posts</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search posts..."
                          className="pl-8 w-64"
                          value={blogFilters.search}
                          onChange={(e) => setBlogFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                      </div>
                      <Select value={blogFilters.status} onValueChange={(value) => setBlogFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Filter Results Indicator */}
                  {(blogFilters.search || blogFilters.status !== 'all') && (
                    <div className="px-6 py-2 bg-blue-50 border-b">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-700">
                          {blogFilters.search && (
                            <span>Searching for "{blogFilters.search}"</span>
                          )}
                          {blogFilters.search && blogFilters.status !== 'all' && <span> • </span>}
                          {blogFilters.status !== 'all' && (
                            <span>Status: {blogFilters.status}</span>
                          )}
                          <span className="ml-2">({blogs.length} result{blogs.length !== 1 ? 's' : ''})</span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setBlogFilters({ search: '', status: 'all', featured: 'all' })}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {blogsLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#2C91D5] mx-auto mb-4" />
                      <p className="text-gray-600">Loading blog posts...</p>
                    </div>
                  ) : blogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No blog posts yet</h3>
                      <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
                      <Button
                        className="bg-[#2C91D5] hover:bg-blue-700"
                        onClick={() => setShowCreateBlog(true)}
                      >
                        Create Your First Post
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Blog posts table */}
                      <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Author</TableHead>
                            <TableHead>Publish Date</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {blogs.map((blog: any) => (
                            <TableRow key={blog.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium">{blog.title}</div>
                                  {blog.is_featured && (
                                    <Badge variant="secondary" className="text-xs">
                                      Featured
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={blog.status === 'published' ? 'default' : 'secondary'}
                                  className={blog.status === 'published' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                                >
                                  {blog.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {blog.author_first_name} {blog.author_last_name}
                              </TableCell>
                              <TableCell>
                                {blog.publish_date ? new Date(blog.publish_date).toLocaleDateString() : 'Not published'}
                              </TableCell>
                              <TableCell>{blog.views || 0}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBlogView(blog)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBlogEdit(blog)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleBlogDelete(blog.id)}
                                  >
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                       </div>
                    </div>
                  )}
                </CardContent>
             </Card>
              </div>
             
            )}

            {/* Case Studies Management Tab */}
            {activeTab === 'case-studies' && (
              <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Case Studies Management</h2>
                  <p className="text-gray-600">Showcase success stories and client achievements</p>
                </div>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCreateCaseStudy(true)}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Create New Case Study
                </Button>
              </div>

              {/* Case Study Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{caseStudyStats.total}</div>
                    <p className="text-xs text-muted-foreground">All case studies</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Published</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{caseStudyStats.published}</div>
                    <p className="text-xs text-muted-foreground">Live stories</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Industries</CardTitle>
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{caseStudyStats.industries}</div>
                    <p className="text-xs text-muted-foreground">Sectors covered</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{caseStudyStats.views}</div>
                    <p className="text-xs text-muted-foreground">All time views</p>
                  </CardContent>
                </Card>
              </div>

              {/* Case Studies Management Interface */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Case Studies</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search case studies..."
                          className="pl-8 w-64"
                          value={caseStudyFilters.search}
                          onChange={(e) => setCaseStudyFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                      </div>
                      <Select value={caseStudyFilters.status} onValueChange={(value) => setCaseStudyFilters(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={caseStudyFilters.industry} onValueChange={(value) => setCaseStudyFilters(prev => ({ ...prev, industry: value }))}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Industries</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {/* Filter Results Indicator */}
                  {(caseStudyFilters.search || caseStudyFilters.status !== 'all' || caseStudyFilters.industry !== 'all') && (
                    <div className="px-6 py-2 bg-green-50 border-b">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-green-700">
                          {caseStudyFilters.search && (
                            <span>Searching for "{caseStudyFilters.search}"</span>
                          )}
                          {caseStudyFilters.search && (caseStudyFilters.status !== 'all' || caseStudyFilters.industry !== 'all') && <span> • </span>}
                          {caseStudyFilters.status !== 'all' && (
                            <span>Status: {caseStudyFilters.status}</span>
                          )}
                          {caseStudyFilters.status !== 'all' && caseStudyFilters.industry !== 'all' && <span> • </span>}
                          {caseStudyFilters.industry !== 'all' && (
                            <span>Industry: {caseStudyFilters.industry}</span>
                          )}
                          <span className="ml-2">({caseStudies.length} result{caseStudies.length !== 1 ? 's' : ''})</span>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCaseStudyFilters({ search: '', status: 'all', industry: 'all' })}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {caseStudiesLoading ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
                      <p className="text-gray-600">Loading case studies...</p>
                    </div>
                  ) : caseStudies.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No case studies yet</h3>
                      <p className="text-gray-500 mb-4">Create your first success story to showcase your impact</p>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setShowCreateCaseStudy(true)}
                      >
                        Create Your First Case Study
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Case studies table */}
                      <div className="overflow-x-auto">
                        <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Industry</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Views</TableHead>
                            <TableHead>Featured</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {caseStudies.map((caseStudy: any) => (
                            <TableRow key={caseStudy.id}>
                              <TableCell>
                                <div className="font-medium">{caseStudy.title}</div>
                              </TableCell>
                              <TableCell>
                                {caseStudy.company_name || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {caseStudy.industry || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={caseStudy.status === 'published' ? 'default' : 'secondary'}
                                  className={caseStudy.status === 'published' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                                >
                                  {caseStudy.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{caseStudy.views || 0}</TableCell>
                              <TableCell>
                                {caseStudy.is_featured ? (
                                  <Badge variant="default" className="bg-blue-600">
                                    <Star className="w-3 h-3 mr-1" />
                                    Featured
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">No</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCaseStudyView(caseStudy)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCaseStudyEdit(caseStudy)}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCaseStudyDelete(caseStudy.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              </div>
            )}
            </div>
          </main>

          {/* Project Details Modal */}
          {selectedProject && (
            <Dialog open={!!selectedProject} onOpenChange={() => {
              setSelectedProject(null);
              setIsEditingProject(false);
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <span>{isEditingProject ? 'Edit Project: ' : ''}{selectedProject.title}</span>
                    <div className="flex items-center space-x-2">
                      {!isEditingProject && (
                        <Button 
                          onClick={startEditingProject}
                          variant="outline"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Project
                        </Button>
                      )}
                      {selectedProject.is_featured && (
                        <Badge className="bg-yellow-500">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge className={getStatusColor(selectedProject.status)}>
                        {selectedProject.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                {isEditingProject ? (
                  <AdminProjectEditForm
                    project={selectedProject}
                    onSave={handleProjectSave}
                    onCancel={handleEditCancel}
                    onSaveAndApprove={handleProjectSaveAndApprove}
                    showApprovalActions={selectedProject.status === 'pending' || selectedProject.status === 'submitted' || selectedProject.status === 'under_review'}
                  />
                ) : (
                  <div className="space-y-6">
                  {/* Project Image */}
                  {(selectedProject.image_url || selectedProject.logo_url) && (
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                      <img 
                        src={selectedProject.image_url || selectedProject.logo_url}
                        alt={selectedProject.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400">Image failed to load</div>';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Project Details</h3>
                        <p className="text-gray-600 mb-4">{selectedProject.short_description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Category:</span>
                            <p className="font-medium">{selectedProject.category}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Stage:</span>
                            <p className="font-medium">{selectedProject.project_stage}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Location:</span>
                            <p className="font-medium">{selectedProject.location}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Team Size:</span>
                            <p className="font-medium">{selectedProject.team_size} people</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Owner Information</h4>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium">{selectedProject.first_name} {selectedProject.last_name}</p>
                          <p className="text-sm text-gray-600">{selectedProject.email}</p>
                          {selectedProject.company && (
                            <p className="text-sm text-gray-600">{selectedProject.company}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Funding Information</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Goal:</span>
                            <span className="font-medium">{formatCurrency(selectedProject.funding_goal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Current:</span>
                            <span className="font-medium">{formatCurrency(selectedProject.current_funding)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Min Investment:</span>
                            <span className="font-medium">{formatCurrency(selectedProject.minimum_investment)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Equity:</span>
                            <span className="font-medium">{selectedProject.equity_percentage}%</span>
                          </div>
                          {selectedProject.valuation && (
                            <div className="flex justify-between">
                              <span>Valuation:</span>
                              <span className="font-medium">{formatCurrency(selectedProject.valuation)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Submission Info</h4>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Submitted:</span>
                            <span>{formatDate(selectedProject.created_at)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Days ago:</span>
                            <span>{selectedProject.days_since_submission}</span>
                          </div>
                          {selectedProject.approved_at && (
                            <div className="flex justify-between">
                              <span>Approved:</span>
                              <span>{formatDate(selectedProject.approved_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedProject.admin_notes && (
                        <div>
                          <h4 className="font-medium mb-2">Admin Notes</h4>
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm">{selectedProject.admin_notes}</p>
                          </div>
                        </div>
                      )}

                      {selectedProject.rejected_reason && (
                        <div>
                          <h4 className="font-medium mb-2">Rejection Reason</h4>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-700">{selectedProject.rejected_reason}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedProject.status === 'pending' && (
                    <div className="border-t pt-4">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Admin Notes (Optional)</label>
                          <Textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add any notes about this decision..."
                            className="mb-4"
                          />
                        </div>
                        
                        <div className="flex space-x-4">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveProject(selectedProject.id, adminNotes)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve Project
                          </Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" className="flex-1">
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject Project
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Project</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Rejection Reason (Required)</label>
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Please provide a clear reason for rejection..."
                                    required
                                  />
                                </div>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => rejectProject(selectedProject.id, rejectionReason, adminNotes)}
                                    disabled={!rejectionReason.trim()}
                                  >
                                    Confirm Rejection
                                  </Button>
                                  <DialogTrigger asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogTrigger>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Create User Form Modal */}
          {showCreateUserForm && (
            <Dialog open={showCreateUserForm} onOpenChange={(open) => setShowCreateUserForm(open)}>
              <DialogContent className="max-w-2xl">
                <AdminUserCreateForm
                  onUserCreated={(newUser) => {
                    console.log('User created successfully:', newUser);
                    setShowCreateUserForm(false);
                    fetchUsers(); // Refresh users list
                  }}
                  onCancel={() => setShowCreateUserForm(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Blog Create Modal */}
          {showCreateBlog && (
            <Dialog open={showCreateBlog} onOpenChange={(open) => setShowCreateBlog(open)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <BlogCreateForm
                  onBlogCreated={handleBlogCreated}
                  onCancel={() => setShowCreateBlog(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Case Study Create Modal */}
          {showCreateCaseStudy && (
            <Dialog open={showCreateCaseStudy} onOpenChange={(open) => setShowCreateCaseStudy(open)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <CaseStudyCreateForm
                  onCaseStudyCreated={handleCaseStudyCreated}
                  onCancel={() => setShowCreateCaseStudy(false)}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Blog Edit Modal */}
          {showEditBlog && selectedBlog && (
            <Dialog open={showEditBlog} onOpenChange={(open) => setShowEditBlog(open)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <BlogEditForm
                  blog={selectedBlog}
                  onBlogUpdated={handleBlogUpdated}
                  onCancel={() => {
                    setShowEditBlog(false);
                    setSelectedBlog(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Blog View Modal */}
          <BlogViewModal
            blog={selectedBlog}
            isOpen={showViewBlog}
            onClose={() => {
              setShowViewBlog(false);
              setSelectedBlog(null);
            }}
            onEdit={() => {
              setShowViewBlog(false);
              setShowEditBlog(true);
            }}
          />

          {/* Case Study Edit Modal */}
          {showEditCaseStudy && selectedCaseStudy && (
            <Dialog open={showEditCaseStudy} onOpenChange={(open) => setShowEditCaseStudy(open)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <CaseStudyEditForm
                  caseStudy={selectedCaseStudy}
                  onCaseStudyUpdated={handleCaseStudyUpdated}
                  onCancel={() => {
                    setShowEditCaseStudy(false);
                    setSelectedCaseStudy(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}

          {/* Case Study View Modal */}
          <CaseStudyViewModal
            caseStudy={selectedCaseStudy}
            isOpen={showViewCaseStudy}
            onClose={() => {
              setShowViewCaseStudy(false);
              setSelectedCaseStudy(null);
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;