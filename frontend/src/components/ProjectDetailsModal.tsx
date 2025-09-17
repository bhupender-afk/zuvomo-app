import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  DollarSign, 
  MapPin, 
  Users, 
  Calendar, 
  Star, 
  Building, 
  TrendingUp,
  FileText,
  Eye,
  ThumbsUp,
  Share2,
  Bookmark,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ProjectDetailsModalProps {
  project: {
    title: string;
    description: string;
    fundRaised: string;
    stage: string;
    tags: string[];
    progress: number;
    rating: number;
    image?: string;
    // Additional details for the modal
    id?: string;
    location?: string;
    teamSize?: number;
    fundingGoal?: string;
    industry?: string;
    valuation?: string;
    createdAt?: string;
    updatedAt?: string;
    ownerName?: string;
    ownerCompany?: string;
    shortDescription?: string;
    currentFunding?: number;
    fundingFromOtherSources?: number;
    equityPercentage?: number;
    ratingCount?: number;
    pitchDeckUrl?: string;
    businessPlanUrl?: string;
    videoUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmit?: (projectId: string, rating: number, review?: string) => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, isOpen, onClose, onRatingSubmit }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [projectReviews, setProjectReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount.replace(/[$,]/g, '')) : amount;
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => interactive && setUserRating(i)}
          disabled={!interactive}
          className={`text-xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
        >
          <Star
            className={`w-5 h-5 ${
              i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        </button>
      );
    }
    return stars;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: project.title,
        text: project.shortDescription || project.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Project link copied to clipboard!');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      alert('Please log in to save projects to your watchlist.');
      return;
    }

    // Only investors can save projects to watchlist
    if (user.role !== 'investor') {
      alert('Only investors can save projects to their watchlist. Please log in with an investor account.');
      return;
    }

    if (!project.id) {
      alert('Unable to save project - invalid project ID.');
      return;
    }

    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        // Remove from watchlist
        console.log('🔄 Removing project from watchlist:', project.id);
        const response = await api.delete(`/watchlist/project/${project.id}`);
        
        if (response.data?.success) {
          setIsBookmarked(false);
          alert('Project removed from your watchlist.');
        } else {
          throw new Error(response.data?.message || 'Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        console.log('🔄 Adding project to watchlist:', project.id);
        const response = await api.post('/watchlist', {
          project_id: project.id
        });
        
        if (response.data?.success) {
          setIsBookmarked(true);
          alert('Project added to your watchlist!');
        } else {
          throw new Error(response.data?.message || 'Failed to add to watchlist');
        }
      }
    } catch (error: any) {
      console.error('❌ Watchlist operation failed:', error);
      
      if (error.response?.status === 401) {
        alert('Please log in to save projects to your watchlist.');
      } else if (error.response?.status === 409) {
        alert('Project is already in your watchlist.');
        setIsBookmarked(true); // Update state to reflect actual status
      } else {
        alert(`Failed to ${isBookmarked ? 'remove from' : 'add to'} watchlist. Please try again.`);
      }
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const handleInvest = () => {
    // TODO: Implement investment functionality
    alert(`Investment feature coming soon for ${project.title}!`);
  };

  const handleSubmitRating = async () => {
    if (!project.id || userRating === 0) {
      console.log('❌ Rating submission blocked:', { projectId: project.id, userRating });
      alert('Please select a rating before submitting.');
      return;
    }

    if (!user) {
      alert('Please log in to submit a rating.');
      return;
    }

    if (user.role !== 'investor') {
      alert('Only investors can rate projects. Please log in with an investor account.');
      return;
    }
    
    setIsSubmittingRating(true);
    console.log('🔄 Starting rating submission:', { 
      projectId: project.id, 
      rating: userRating, 
      review: userReview,
      userRole: user.role,
      userId: user.id 
    });
    
    try {
      if (onRatingSubmit) {
        // Use parent's rating submission function if provided
        console.log('🔄 Using parent rating function');
        await onRatingSubmit(project.id, userRating, userReview);
      } else {
        // Default API call (anonymous)
        console.log('🔄 Making direct API call to /ratings/project/' + project.id);
        const response = await api.post(`/ratings/project/${project.id}`, {
          rating: userRating,
          review: userReview || '',
          is_anonymous: true // Keep investor identity anonymous
        });
        
        console.log('✅ Rating API response:', response);
        console.log('✅ Response data:', response.data);
        console.log('✅ Response status:', response.status);
        
        if (response.data?.success) {
          alert('Rating submitted successfully!');
          // Refresh reviews after successful submission
          fetchProjectReviews();
        } else {
          console.error('❌ API returned success=false:', response.data);
          throw new Error(response.data?.message || 'Failed to submit rating');
        }
      }
      
      // Reset form only after successful submission
      setUserRating(0);
      setUserReview('');
    } catch (error: any) {
      console.error('❌ Rating submission failed:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      let errorMessage = 'Failed to submit rating. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to submit a rating.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to rate this project.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Rating endpoint not found. Please contact support.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Fetch project reviews and check watchlist status when modal opens
  React.useEffect(() => {
    if (isOpen && project.id) {
      fetchProjectReviews();
      checkWatchlistStatus();
    }
  }, [isOpen, project.id, user]);

  const checkWatchlistStatus = async () => {
    if (!user || !project.id || user.role !== 'investor') return;
    
    try {
      console.log('🔄 Checking if project is in watchlist:', project.id);
      const response = await api.get('/watchlist');
      
      if (response.data?.success && response.data.watchlist) {
        const isInWatchlist = response.data.watchlist.some((item: any) => 
          String(item.project_id) === String(project.id)
        );
        setIsBookmarked(isInWatchlist);
        console.log('✅ Watchlist status:', isInWatchlist ? 'In watchlist' : 'Not in watchlist');
      }
    } catch (error) {
      console.error('❌ Error checking watchlist status:', error);
      // Don't show error to user, just assume not bookmarked
      setIsBookmarked(false);
    }
  };

  const fetchProjectReviews = async () => {
    try {
      setReviewsLoading(true);
      console.log('🔄 Fetching reviews for project:', project.id);
      const response = await api.get(`/ratings/project/${project.id}/reviews`);
      
      if (response.data?.success) {
        setProjectReviews(response.data.reviews || []);
        console.log('✅ Fetched reviews:', response.data.reviews?.length || 0);
      } else {
        console.log('⚠️ No reviews found or API error');
        setProjectReviews([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch reviews:', error);
      setProjectReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative">
            {project.image ? (
              <div className="h-64 bg-gradient-to-r from-blue-500 to-purple-600 relative overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-30" />
              </div>
            ) : (
              <div className="h-64 bg-gradient-to-r from-[#2C91D5] to-[#1976D2] relative" />
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 bg-white bg-opacity-20 backdrop-blur-sm hover:bg-white hover:bg-opacity-30 text-white"
            >
              <X className="w-4 h-4" />
            </Button>

            {/* Project Title and Basic Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{project.title}</h1>
                  <div className="flex items-center gap-4 text-sm opacity-90">
                    {project.industry && (
                      <div className="flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {project.industry}
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {project.location}
                      </div>
                    )}
                    {project.teamSize && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {project.teamSize} team members
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleShare}
                    className="bg-white bg-opacity-20 backdrop-blur-sm hover:bg-white hover:bg-opacity-30 text-white border-white border-opacity-30"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  {/* Only show Save button for investors */}
                  {user?.role === 'investor' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleBookmark}
                      disabled={isBookmarkLoading}
                      className={`backdrop-blur-sm border-white border-opacity-30 ${
                        isBookmarked 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-white bg-opacity-20 hover:bg-white hover:bg-opacity-30 text-white'
                      } ${isBookmarkLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isBookmarkLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                      ) : (
                        <Bookmark className={`w-4 h-4 mr-1 ${isBookmarked ? 'fill-current' : ''}`} />
                      )}
                      {isBookmarkLoading ? 'Saving...' : (isBookmarked ? 'Saved' : 'Save')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="funding">Funding</TabsTrigger>
                <TabsTrigger value="team">Team & Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Funding Progress */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Funding Progress</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#2C91D5]">{project.fundRaised}</div>
                      <div className="text-sm text-gray-600">
                        {project.fundingGoal && `of ${project.fundingGoal} goal`}
                      </div>
                    </div>
                  </div>
                  <Progress value={project.progress} className="h-3 mb-2" />
                  <div className="text-center text-sm font-medium text-blue-700">
                    {project.progress}% Funded
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Project</h3>
                  <p className="text-gray-600 leading-relaxed">{project.description}</p>
                </div>

                {/* Tags */}
                {project.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rating and Reviews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Project Rating</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        {renderStars(project.rating)}
                      </div>
                      <span className="text-lg font-semibold">{project.rating.toFixed(1)}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {project.ratingCount || 0} review{(project.ratingCount || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Rate This Project</h4>
                    {user?.role === 'investor' ? (
                      <div className="space-y-3">
                        <div className="flex gap-1 mb-2">
                          {renderStars(userRating, true)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {userRating > 0 ? `You rated: ${userRating} star${userRating !== 1 ? 's' : ''}` : 'Click stars to rate'}
                        </p>
                        {userRating > 0 && (
                          <div className="space-y-2">
                            <textarea
                              value={userReview}
                              onChange={(e) => setUserReview(e.target.value)}
                              placeholder="Add a review (optional)..."
                              className="w-full p-2 border rounded-md text-sm"
                              rows={3}
                            />
                            <Button 
                              size="sm"
                              onClick={handleSubmitRating}
                              disabled={isSubmittingRating}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">
                        Only investors can rate projects. Please log in as an investor to submit a rating.
                      </div>
                    )}
                  </div>
                </div>

                {/* Anonymous Reviews Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Reviews
                  </h4>
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading reviews...</span>
                    </div>
                  ) : projectReviews.length > 0 ? (
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {projectReviews.map((review: any, index: number) => (
                        <div key={index} className="border-b border-gray-100 pb-3 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= (review.rating || 0) 
                                      ? 'fill-yellow-400 text-yellow-400' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{review.rating}/5</span>
                            <span className="text-xs text-gray-500">
                              Reviewer • {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {review.review && (
                            <p className="text-sm text-gray-700 italic">"{review.review}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No reviews yet. Be the first to review this project!</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Funding Tab */}
              <TabsContent value="funding" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Funding Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Funding Goal:</span>
                        <span className="font-semibold">{project.fundingGoal || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Current Funding:</span>
                        <span className="font-semibold text-green-600">{project.fundRaised}</span>
                      </div>
                      {project.fundingFromOtherSources && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Other Sources:</span>
                          <span className="font-semibold">{formatCurrency(project.fundingFromOtherSources)}</span>
                        </div>
                      )}
                      {project.equityPercentage && (
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-gray-600">Equity Offered:</span>
                          <span className="font-semibold">{project.equityPercentage}%</span>
                        </div>
                      )}
                      {project.valuation && (
                        <div className="flex justify-between py-2">
                          <span className="text-gray-600">Company Valuation:</span>
                          <span className="font-semibold">{project.valuation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Investment Opportunity</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                        <h4 className="font-medium text-green-800">Ready to Invest?</h4>
                      </div>
                      <p className="text-sm text-green-700 mb-4">
                        Join other investors in funding this promising project.
                      </p>
                      <Button 
                        onClick={handleInvest}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Invest Now
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Team & Details Tab */}
              <TabsContent value="team" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Details</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Project Stage:</span>
                        <span className="font-semibold capitalize">{project.stage}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Industry:</span>
                        <span className="font-semibold">{project.industry || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-semibold">{project.location || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Team Size:</span>
                        <span className="font-semibold">{project.teamSize || 'N/A'} members</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-semibold">{formatDate(project.createdAt)}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-semibold">{formatDate(project.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Owner</h3>
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-[#2C91D5] rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                          {project.ownerName ? project.ownerName.charAt(0) : 'U'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{project.ownerName || 'Project Owner'}</h4>
                          {project.ownerCompany && (
                            <p className="text-sm text-gray-600">{project.ownerCompany}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Experienced entrepreneur passionate about innovation and growth.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6">
                    <h4 className="font-medium mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-blue-600" />
                      Business Plan
                    </h4>
                    {project.businessPlanUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                              <p className="font-medium text-sm">Business Plan.pdf</p>
                              <p className="text-xs text-gray-500">Comprehensive business strategy</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Business plan not available</p>
                    )}
                  </div>

                  <div className="border rounded-lg p-6">
                    <h4 className="font-medium mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-green-600" />
                      Pitch Deck
                    </h4>
                    {project.pitchDeckUrl ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="w-8 h-8 text-green-600 mr-3" />
                            <div>
                              <p className="font-medium text-sm">Pitch Deck.pdf</p>
                              <p className="text-xs text-gray-500">Investor presentation</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Pitch deck not available</p>
                    )}
                  </div>

                  {project.videoUrl && (
                    <div className="border rounded-lg p-6 md:col-span-2">
                      <h4 className="font-medium mb-4 flex items-center">
                        <ExternalLink className="w-5 h-5 mr-2 text-purple-600" />
                        Project Video
                      </h4>
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <Button variant="outline" size="lg">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Watch Project Video
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer Actions */}
          <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>1,234 views</span>
              </div>
              <div className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                <span>89 likes</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleInvest} className="bg-[#2C91D5] hover:bg-[#2C91D5]/90">
                <DollarSign className="w-4 h-4 mr-2" />
                Invest Now
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ProjectDetailsModal;