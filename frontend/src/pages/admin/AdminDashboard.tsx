import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
  Clock
} from 'lucide-react';
import api from '../../services/api';
import AdminProjectEditForm from '../../components/AdminProjectEditForm';
import { AdminUserCreateForm } from '../../components/AdminUserCreateForm';
import BlogCreateForm from '../../components/BlogCreateForm';
import CaseStudyCreateForm from '../../components/CaseStudyCreateForm';

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
  const [activeTab, setActiveTab] = useState('overview');
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
  const [showCreateCaseStudy, setShowCreateCaseStudy] = useState(false);
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
      console.log('AdminDashboard: Fetching blogs');
      const response = await api.get('/blogs/admin/all');
      console.log('AdminDashboard: Blogs response', response);
      
      if (response.data && response.data.success) {
        setBlogs(response.data.data || []);
        // Update blog stats
        const blogData = response.data.data || [];
        setBlogStats({
          total: blogData.length,
          published: blogData.filter((blog: any) => blog.status === 'published').length,
          drafts: blogData.filter((blog: any) => blog.status === 'draft').length,
          views: blogData.reduce((sum: number, blog: any) => sum + (blog.views || 0), 0)
        });
      } else {
        console.error('AdminDashboard: Failed to fetch blogs', response.error);
        setBlogs([]);
      }
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
      setBlogs([]);
    } finally {
      setBlogsLoading(false);
    }
  };

  const fetchCaseStudies = async () => {
    try {
      setCaseStudiesLoading(true);
      console.log('AdminDashboard: Fetching case studies');
      const response = await api.get('/case-studies/admin/all');
      console.log('AdminDashboard: Case studies response', response);
      
      if (response.data && response.data.success) {
        setCaseStudies(response.data.data || []);
        // Update case study stats
        const caseStudyData = response.data.data || [];
        const uniqueIndustries = new Set(caseStudyData.map((cs: any) => cs.industry).filter(Boolean));
        setCaseStudyStats({
          total: caseStudyData.length,
          published: caseStudyData.filter((cs: any) => cs.status === 'published').length,
          industries: uniqueIndustries.size,
          views: caseStudyData.reduce((sum: number, cs: any) => sum + (cs.views || 0), 0)
        });
      } else {
        console.error('AdminDashboard: Failed to fetch case studies', response.error);
        setCaseStudies([]);
      }
    } catch (error) {
      console.error('Failed to fetch case studies:', error);
      setCaseStudies([]);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': case 'under_review': case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'pending_update': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'funded': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">Zuvomo</h1>
                <span className="ml-3 text-sm text-gray-500">Admin Dashboard</span>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button variant="ghost" size="sm">Logout</Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="pending-reviews" className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Pending Reviews
                {((stats?.project_counts.pending || 0) + (stats?.project_counts.submitted || 0) + (stats?.project_counts.under_review || 0)) > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-white" variant="secondary">
                    {(stats?.project_counts.pending || 0) + (stats?.project_counts.submitted || 0) + (stats?.project_counts.under_review || 0)}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                All Projects
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center">
                <PieChart className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="blogs" className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Blog Posts
              </TabsTrigger>
              <TabsTrigger value="case-studies" className="flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Case Studies
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Pending Projects Alert */}
              {((stats?.project_counts.pending || 0) + (stats?.project_counts.submitted || 0) + (stats?.project_counts.under_review || 0)) > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-yellow-800">
                          {(stats.project_counts.pending || 0) + (stats.project_counts.submitted || 0) + (stats.project_counts.under_review || 0)} Project{((stats.project_counts.pending || 0) + (stats.project_counts.submitted || 0) + (stats.project_counts.under_review || 0)) > 1 ? 's' : ''} Awaiting Review
                        </h3>
                        <p className="text-sm text-yellow-700">
                          New projects have been submitted and need admin approval to go live.
                        </p>
                      </div>
                    </div>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      onClick={() => setActiveTab('pending-reviews')}
                    >
                      Review Now
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.project_counts.total || 0}</div>
                    <p className="text-xs text-muted-foreground">All projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {(stats?.project_counts.pending || 0) + (stats?.project_counts.submitted || 0) + (stats?.project_counts.under_review || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Approved Projects</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats?.project_counts.approved || 0}</div>
                    <p className="text-xs text-muted-foreground">Live projects</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Funding</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats?.funding_stats.total_current_funding || 0)}</div>
                    <p className="text-xs text-muted-foreground">Current funding</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity & Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.recent_activity && stats.recent_activity.length > 0 ? (
                      <div className="space-y-4">
                        {stats.recent_activity.slice(0, 5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{activity.title}</h4>
                              <p className="text-sm text-gray-500">by {activity.owner_name}</p>
                              <p className="text-xs text-gray-400">{formatDate(activity.created_at)}</p>
                            </div>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveTab('projects')}
                        >
                          View All Projects
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No recent activity</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                        onClick={() => setActiveTab('pending-reviews')}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        Review Pending Projects ({stats?.project_counts.pending || 0})
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => setActiveTab('users')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
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
              </div>

              {/* Category Breakdown */}
              {stats?.category_breakdown && stats.category_breakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.category_breakdown.map((category) => (
                        <div key={category.category} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium">{category.category}</h3>
                              <p className="text-sm text-gray-500">{category.count} projects</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(category.total_funding)}</p>
                              <p className="text-xs text-gray-500">total funding</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Pending Reviews Tab */}
            <TabsContent value="pending-reviews" className="space-y-6">
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
              </Card>
            </TabsContent>

            {/* Project Management Tab */}
            <TabsContent value="projects" className="space-y-6">
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
                </Card>
              )}
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  <p className="text-gray-600">Manage platform users and their permissions</p>
                </div>
                <Button onClick={() => setShowCreateUserForm(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Users className="w-4 h-4 mr-2" />
                  Create New User
                </Button>
              </div>

              {/* User Filters */}
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
                        placeholder="Search users..."
                        value={userFilters.search}
                        onChange={(e) => setUserFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                    
                    <Select value={userFilters.role} onValueChange={(value) => setUserFilters(prev => ({ ...prev, role: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="project_owner">Project Owner</SelectItem>
                        <SelectItem value="investor">Investor</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={userFilters.status} onValueChange={(value) => setUserFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={userFilters.sort} onValueChange={(value) => setUserFilters(prev => ({ ...prev, sort: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Latest</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="role">Role</SelectItem>
                        <SelectItem value="last_login">Last Login</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Users Table */}
              {usersLoading ? (
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <div>
                              <p className="text-gray-500 mb-2">No users found</p>
                              <p className="text-sm text-gray-400">
                                No users match the current filter criteria, or users are still loading
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(user.role)}>
                                {user.role.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{user.company || 'N/A'}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {user.is_active ? (
                                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                                )}
                                {user.email_verified && (
                                  <Badge variant="outline" className="text-xs">Verified</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{formatDate(user.created_at)}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
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
            </TabsContent>

            {/* Blog Management Tab */}
            <TabsContent value="blogs" className="space-y-6">
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
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No blog posts yet</h3>
                    <p className="text-gray-500 mb-4">Create your first blog post to get started</p>
                    <Button className="bg-[#2C91D5] hover:bg-blue-700">
                      Create Your First Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Case Studies Management Tab */}
            <TabsContent value="case-studies" className="space-y-6">
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
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select defaultValue="all-industries">
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-industries">All Industries</SelectItem>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No case studies yet</h3>
                    <p className="text-gray-500 mb-4">Create your first success story to showcase your impact</p>
                    <Button className="bg-green-600 hover:bg-green-700">
                      Create Your First Case Study
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

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
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;