import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Search, Filter, Star, Heart, TrendingUp, Clock, MapPin, Users, DollarSign, User, Menu, X } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import ProjectCard from '../../components/ProjectCard';
import ProjectDetailsModal from '../../components/ProjectDetailsModal';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

// Clean ProjectCard data interface - tags should be simple string arrays

interface Project {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  category: string;
  funding_goal: number;
  current_funding: number;
  location: string;
  team_size: number;
  funding_percentage: number;
  progress_percentage: number;
  minimum_investment: number;
  equity_percentage: number;
  average_rating: number;
  rating_count: number;
  is_featured: boolean;
  image_url?: string;
  owner: {
    first_name: string;
    last_name: string;
    company: string;
  };
  tags: Array<{
    id: number;
    name: string;
    color: string;
  }> | string[] | string;
  tagsArray?: string[];
}

interface FilterOptions {
  categories: string[];
  stages: string[];
  locations: Array<{ name: string; count: number }>;
  tags: Array<{
    id: number;
    name: string;
    color: string;
    project_count: number;
  }>;
}

interface SearchFilters {
  search: string;
  category: string;
  stage: string;
  location: string;
  sort: string;
  featured_only: boolean;
  min_rating: number;
}

interface Investment {
  id: string;
  amount: number;
  investment_date: string;
  status: string;
  project_title: string;
  project_category: string;
  project_funding_percentage: number;
}

interface PortfolioStats {
  total_investments: number;
  total_invested: number;
  average_investment: number;
  completed_investments: number;
  pending_investments: number;
}

// Homepage-compatible data transformation function
const transformBackendToHomepageFormat = (projects: BackendProject[]): ProjectData[] => {
  return projects
    .map((project) => {
      try {
        // Calculate funding in millions for display
        const fundingInMillions = (project.current_funding || 0) / 1000000;
        
        // Process tags like homepage does
        let tags: string[] = [];
        if (project.tagsArray && Array.isArray(project.tagsArray)) {
          tags = project.tagsArray;
        } else if (typeof project.tags === 'string' && project.tags.trim()) {
          tags = project.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        } else if (project.category && typeof project.category === 'string') {
          tags = [project.category];
        }
        
        // Debug logging for tag processing
        console.log(`[ProjectTransform] ${project.title} - Original tags:`, project.tags);
        console.log(`[ProjectTransform] ${project.title} - TagsArray:`, project.tagsArray);
        console.log(`[ProjectTransform] ${project.title} - Final tags:`, tags);
        
        return {
          id: project.id || `project-${Date.now()}`,
          title: project.title || 'Untitled Project',
          description: project.description || 'No description available',
          fundRaised: project.fundRaised || `$${fundingInMillions.toFixed(1)}M`,
          stage: project.stage || 'Early Stage',
          tags: tags,
          progress: Math.max(0, Math.min(100, parseFloat(project.progress?.toString() || project.progress_percentage?.toString() || '0') || 0)),
          rating: Math.max(0, Math.min(5, parseFloat(project.rating?.toString() || project.average_rating?.toString() || '5.0') || 5.0)),
          image: (() => {
            let imageUrl = project.image_url || project.logo_url;
            if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/placeholder')) {
              imageUrl = `http://13.200.209.191:8080${imageUrl}`;
            }
            return imageUrl || '/placeholder.svg';
          })(),
          owner_name: project.owner ? `${project.owner.first_name} ${project.owner.last_name}` : '',
          location: project.location,
          team_size: project.team_size,
          is_featured: project.is_featured,
          category: project.category,
          funding_goal: project.funding_goal,
          current_funding: project.current_funding,
          owner: project.owner
        };
      } catch (error) {
        console.warn('Error transforming project:', project.id, error);
        return null;
      }
    })
    .filter(Boolean) as ProjectData[];
};

const InvestorDashboard: React.FC = () => {
  const { user,logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [featuredProjects, setFeaturedProjects] = useState<ProjectData[]>([]);
  const [newProjects, setNewProjects] = useState<ProjectData[]>([]);
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  const [recentProjects, setRecentProjects] = useState<ProjectData[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<ProjectData[]>([]);
  const [watchlist, setWatchlist] = useState<ProjectData[]>([]);
  const [recentInvestments, setRecentInvestments] = useState<Investment[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    search: '',
    category: '',
    stage: '',
    location: '',
    sort: 'created_at',
    featured_only: false,
    min_rating: 0
  });
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [watchlistIds, setWatchlistIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch filter options
        const filtersResponse = await api.get('/projects/data/filters');
        if (filtersResponse.data?.success) {
          setFilterOptions(filtersResponse.data.data);
        }

        // Fetch all approved projects
        const approvedResponse = await api.get('/projects/approved?limit=20');
        console.log('Approved projects response:', approvedResponse);
        
        if (approvedResponse.data?.projects) {
          const backendProjects = approvedResponse.data.projects;
          console.log('✅ Fetched backend projects:', backendProjects.length);
          
          // Transform to homepage-compatible format
          const transformedProjects = transformBackendToHomepageFormat(backendProjects);
          console.log('✅ Transformed projects:', transformedProjects.length);
          console.log('✅ Sample transformed project:', transformedProjects[0]);
          
          // Sort projects by creation date (newest first)
          const sortedByDate = [...transformedProjects].sort((a, b) =>
            new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()
          );

          // Filter featured projects (priority 1)
          const featured = transformedProjects.filter((p) => p.is_featured);
          setFeaturedProjects(featured.length > 0 ? featured : []);

          // Get new projects (created in last 30 days, priority 2)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const newProjectsList = sortedByDate.filter((p) => {
            const createdDate = new Date(p.created_at || Date.now());
            return createdDate >= thirtyDaysAgo && !p.is_featured; // Exclude featured from new
          }).slice(0, 9);
          setNewProjects(newProjectsList);

          // Set all projects for different tabs (priority 3)
          setRecentProjects(sortedByDate.slice(0, 9)); // Most recent 9
          setRecommendedProjects(transformedProjects.slice(0, 9)); // All approved projects for now
        }

        // Fetch watchlist
        const watchlistResponse = await api.get('/watchlist');
        if (watchlistResponse.data?.success) {
          const watchlistItems = watchlistResponse.data.data.watchlist;
          // Transform watchlist items to ProjectData format
          const transformedWatchlist = watchlistItems.map((item: any) => {
            return {
              id: item.project_id?.toString() || item.id?.toString(),
              title: item.title,
              description: item.description,
              fundRaised: item.fundRaised || `$${((item.current_funding || 0) / 1000000).toFixed(1)}M`,
              stage: item.stage || 'Early Stage',
              tags: item.tagsArray || (typeof item.tags === 'string' ? item.tags.split(',').map((t: string) => t.trim()) : []),
              progress: item.progress_percentage || item.progress || 0,
              rating: item.rating || item.average_rating || 5.0,
              image: item.image || item.image_url || item.logo_url,
              owner_name: item.owner ? `${item.owner.first_name} ${item.owner.last_name}` : '',
              location: item.location,
              team_size: item.team_size,
              is_featured: item.is_featured,
              category: item.category,
              funding_goal: item.funding_goal,
              current_funding: item.current_funding,
              owner: item.owner
            };
          });
          setWatchlist(transformedWatchlist);
          const ids = new Set(watchlistItems.map((p: any) => p.project_id.toString()));
          setWatchlistIds(ids);
        }

        // Fetch portfolio stats
        try {
          const portfolioResponse = await api.get('/investments/my/portfolio');
          if (portfolioResponse.data) {
            setPortfolioStats(portfolioResponse.data.stats);
          }
        } catch (error) {
          console.log('No portfolio stats available (user may not have investments yet)');
        }

        // Fetch recent investments
        try {
          const investmentsResponse = await api.get('/investments/my/investments?limit=5');
          if (investmentsResponse.data) {
            setRecentInvestments(investmentsResponse.data.investments);
          }
        } catch (error) {
          console.log('No investment history available');
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch filtered projects when filters change
  useEffect(() => {
    if (activeTab === 'all-projects' || activeTab === 'browse') {
      fetchFilteredProjects();
    }
  }, [filters, activeTab]);

  const fetchFilteredProjects = async () => {
    try {
      setProjectsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.stage) params.append('stage', filters.stage);
      if (filters.location) params.append('location', filters.location);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('limit', '12');

      // Use approved projects API with filters
      const response = await api.get(`/projects/approved?${params.toString()}`);
      console.log('Filtered projects response:', response);
      
      if (response.data?.projects) {
        let backendProjects = response.data.projects;
        
        // Transform to homepage-compatible format
        let transformedProjects = transformBackendToHomepageFormat(backendProjects);
        
        // Apply frontend filtering for features not supported by backend
        if (filters.featured_only) {
          transformedProjects = transformedProjects.filter((p) => p.is_featured);
        }
        if (filters.min_rating > 0) {
          transformedProjects = transformedProjects.filter((p) => p.rating >= filters.min_rating);
        }
        
        setAllProjects(transformedProjects);
      }
    } catch (error) {
      console.error('Failed to fetch filtered projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const toggleWatchlist = async (projectId: string) => {
    try {
      const isInWatchlist = watchlistIds.has(projectId);
      
      if (isInWatchlist) {
        await api.delete(`/watchlist/project/${projectId}`);
        setWatchlistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(projectId);
          return newSet;
        });
        setWatchlist(prev => prev.filter(p => p.id.toString() !== projectId));
      } else {
        await api.post(`/watchlist/project/${projectId}`, {});
        setWatchlistIds(prev => new Set([...prev, projectId]));
        // Refetch watchlist to get complete project data
        const watchlistResponse = await api.get('/watchlist');
        if (watchlistResponse.data?.success) {
          setWatchlist(watchlistResponse.data.data.watchlist);
        }
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    }
  };

  // Rating submission for investors only (anonymous)
  const submitRating = async (projectId: string, rating: number, review?: string) => {
    if (!user || user.role !== 'investor') {
      alert('Only investors can rate projects. Please log in as an investor.');
      return;
    }

    console.log('🔄 Submitting rating:', { projectId, rating, review, userRole: user.role });

    try {
      const response = await api.post(`/ratings/project/${projectId}`, {
        rating,
        review: review || '',
        is_anonymous: true // Keep investor identity anonymous
      });
      
      console.log('✅ Rating API response:', response.data);
      
      if (response.data?.success) {
        alert('Rating submitted successfully! Your review will be visible anonymously.');
        // Refresh project data to show updated rating
        if (activeTab === 'all-projects') {
          fetchFilteredProjects();
        }
        setUserRating(0);
      } else {
        console.error('❌ Rating submission failed:', response.data);
        throw new Error(response.data?.message || 'Failed to submit rating');
      }
    } catch (error: any) {
      console.error('❌ Rating submission error:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to submit rating. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'You need to be logged in as an investor to rate projects.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to rate this project.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Rating endpoint not found. Please contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(`Error: ${errorMessage}`);
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
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Handler for project card "Know More" button
  const handleViewDetails = (project: ProjectData) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['investor']} requireApproval={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'featured', label: 'Featured', icon: Star },
    { id: 'new', label: 'New Projects', icon: Clock },
    { id: 'browse', label: 'Browse', icon: Search },
    { id: 'all-projects', label: 'All Projects', icon: Filter },
    { id: 'watchlist', label: 'Watchlist', icon: Heart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <ProtectedRoute allowedRoles={['investor']} requireApproval={false}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar Navigation */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} ${isMobile && !sidebarCollapsed ? 'fixed inset-y-0 left-0 z-50' : ''} bg-white shadow-lg border-r transition-all duration-300 flex flex-col`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">Zuvomo</h1>
                  <span className="ml-2 text-xs text-gray-500">Investor</span>
                </div>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 hover:bg-gray-100"
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <IconComponent className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-3'}`} />
                  {!sidebarCollapsed && (
                    <span>{item.label}</span>
                  )}
                  {!sidebarCollapsed && item.id === 'watchlist' && (
                    <Badge className="ml-auto bg-red-100 text-red-700 text-xs">
                      {watchlist.length}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`w-full ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'}`}
              title={sidebarCollapsed ? 'Logout' : undefined}
              onClick={logout}
            >
              <User className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-2'}`} />
              {!sidebarCollapsed && 'Logout'}
            </Button>
          </div>
        </div>

        {/* Mobile Overlay */}
        {isMobile && !sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarCollapsed(true)}
          />
        )}

        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${isMobile && !sidebarCollapsed ? 'ml-0' : ''}`}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h2>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('watchlist')}>
                    <Heart className="w-4 h-4 mr-2" />
                    Watchlist ({watchlist.length})
                  </Button>
                  <Button variant="ghost" size="sm">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Portfolio
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
              {/* Portfolio Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(portfolioStats?.total_invested || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Across all investments</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Investments</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{portfolioStats?.total_investments || 0}</div>
                    <p className="text-xs text-muted-foreground">Projects invested in</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Investment</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(portfolioStats?.average_investment || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Per project</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(portfolioStats?.pending_investments || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Processing</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('all-projects')}
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse All Projects
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('watchlist')}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      View Watchlist ({watchlist.length})
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('featured')}
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Featured Projects
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Investments Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentInvestments.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <DollarSign className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No investments yet</h3>
                        <p className="text-gray-500 mb-4">
                          Start building your portfolio by investing in promising projects.
                        </p>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => setActiveTab('all-projects')}
                        >
                          Browse Projects
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentInvestments.map((investment) => (
                          <div
                            key={investment.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900">{investment.project_title}</h4>
                              <p className="text-sm text-gray-500">{investment.project_category}</p>
                              <p className="text-xs text-gray-400">{formatDate(investment.investment_date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(investment.amount)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(investment.status)}`}>
                                {investment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Featured Projects Available</h4>
                      <p className="text-sm text-blue-700">
                        {featuredProjects.length} featured projects are currently seeking investment
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setActiveTab('featured')}
                      >
                        View Featured
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Recent Additions</h4>
                      <p className="text-sm text-green-700">
                        {recentProjects.length} new projects added this month
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mt-2 border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
                        onClick={() => setActiveTab('recent')}
                      >
                        Explore Recent
                      </Button>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Recommended for You</h4>
                      <p className="text-sm text-yellow-700">
                        {recommendedProjects.length} highly-rated projects match your interests
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="mt-2 border-yellow-600 text-yellow-700 hover:bg-yellow-600 hover:text-white"
                        onClick={() => setActiveTab('recommended')}
                      >
                        View Recommendations
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            )}

            {/* Featured Projects Tab */}
            {activeTab === 'featured' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Featured Projects</h2>
                    <p className="text-gray-600">Hand-picked high-potential projects</p>
                  </div>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Star className="w-3 h-3 mr-1" />
                    {featuredProjects.length} Featured
                  </Badge>
                </div>

                {featuredProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No featured projects yet</h3>
                    <p className="text-gray-500">Check back soon for hand-picked investment opportunities</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onViewDetails={() => handleViewDetails(project)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Projects Tab */}
            {activeTab === 'new' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">New Projects</h2>
                    <p className="text-gray-600">Recently added projects seeking investment</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Clock className="w-3 h-3 mr-1" />
                    {newProjects.length} New (Last 30 days)
                  </Badge>
                </div>

                {newProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No new projects</h3>
                    <p className="text-gray-500">No new projects have been added in the last 30 days</p>
                    <Button
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('all-projects')}
                    >
                      Browse All Projects
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newProjects.map((project) => (
                      <div key={project.id} className="relative">
                        <ProjectCard
                          project={project}
                          onViewDetails={() => handleViewDetails(project)}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge className="bg-green-500 text-white text-xs">
                            NEW
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Browse Tab - Simple search interface */}
            {activeTab === 'browse' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Browse Projects</h2>
                    <p className="text-gray-600">Search projects by name and category</p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Search className="w-3 h-3 mr-1" />
                    {allProjects.length} Available
                  </Badge>
                </div>
                
                {/* Simple Search */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by project name..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={filters.category || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? '' : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Gaming">Gaming</SelectItem>
                          <SelectItem value="Real Estate">Real Estate</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                
                {projectsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allProjects.map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project}
                        onViewDetails={() => handleViewDetails(project)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                    <p className="text-gray-600">Manage your account and preferences</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="text-lg font-medium">John Investor</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-lg font-medium">investor@zuvomo.com</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-lg font-medium">Investment Fund LLC</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Location</label>
                        <p className="text-lg font-medium">New York, NY</p>
                      </div>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Edit Profile
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Investment Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Investment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Invested</span>
                        <span className="font-semibold">{formatCurrency(portfolioStats?.total_invested || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Active Investments</span>
                        <span className="font-semibold">{portfolioStats?.active_investments || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Watchlist Items</span>
                        <span className="font-semibold">{watchlist.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Portfolio Value</span>
                        <span className="font-semibold text-green-600">{formatCurrency(portfolioStats?.portfolio_value || 0)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* All Projects Tab with Filters */}
            {activeTab === 'all-projects' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
                    <p className="text-gray-600">Discover and filter investment opportunities</p>
                  </div>
                </div>

                {/* Search and Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      Search & Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search projects..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={filters.category || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? '' : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {filterOptions?.categories.map((category) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={filters.stage || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value === 'all' ? '' : value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Stages</SelectItem>
                          {filterOptions?.stages.map((stage) => (
                            <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select value={filters.sort} onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">Latest</SelectItem>
                          <SelectItem value="funding_goal">Funding Goal</SelectItem>
                          <SelectItem value="current_funding">Current Funding</SelectItem>
                          <SelectItem value="rating">Highest Rated</SelectItem>
                          <SelectItem value="progress">Progress</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        variant={filters.featured_only ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, featured_only: !prev.featured_only }))}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Featured Only
                      </Button>
                      
                      <Select value={filters.min_rating.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, min_rating: parseInt(value) }))}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Any Rating</SelectItem>
                          <SelectItem value="3">3+ Stars</SelectItem>
                          <SelectItem value="4">4+ Stars</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Projects Grid */}
                {projectsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <div className="aspect-video bg-gray-200 rounded-t-lg" />
                        <CardContent className="p-4 space-y-3">
                          <div className="h-4 bg-gray-200 rounded" />
                          <div className="h-3 bg-gray-200 rounded w-2/3" />
                          <div className="h-2 bg-gray-200 rounded w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : allProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500">Try adjusting your filters to find more projects</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allProjects.map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project}
                        onViewDetails={() => handleViewDetails(project)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Watchlist</h2>
                    <p className="text-gray-600">Projects you're following</p>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <Heart className="w-3 h-3 mr-1" />
                    {watchlist.length} Saved
                  </Badge>
                </div>
                
                {watchlist.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Your watchlist is empty</h3>
                    <p className="text-gray-500 mb-4">
                      Save interesting projects to your watchlist to keep track of them
                    </p>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setActiveTab('all-projects')}
                    >
                      Browse Projects
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlist.map((project) => (
                      <ProjectCard 
                        key={project.id} 
                        project={project}
                        onViewDetails={() => handleViewDetails(project)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Project Details Modal */}
            {selectedProject && (
              <ProjectDetailsModal
                project={{
                  title: selectedProject.title,
                  description: selectedProject.description,
                  fundRaised: selectedProject.fundRaised,
                  stage: selectedProject.stage,
                  tags: selectedProject.tags,
                  progress: selectedProject.progress,
                  rating: selectedProject.rating,
                  image: selectedProject.image,
                  id: selectedProject.id,
                  location: selectedProject.location,
                  teamSize: selectedProject.team_size,
                  fundingGoal: selectedProject.funding_goal ? `$${(selectedProject.funding_goal / 1000000).toFixed(1)}M` : undefined,
                  industry: selectedProject.category,
                  ownerName: selectedProject.owner_name,
                  ownerCompany: selectedProject.owner?.company,
                  currentFunding: selectedProject.current_funding,
                  equityPercentage: 10, // Default value
                  ratingCount: 25 // Default value
                }}
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedProject(null);
                }}
                onRatingSubmit={submitRating}
              />
            )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InvestorDashboard;