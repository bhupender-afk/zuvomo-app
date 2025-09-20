import React, { useEffect, useState } from 'react';
import { Check, Star, RotateCcw, Share2, TrendingUp, Users, DollarSign } from 'lucide-react';
import Header from '../Header';
import StickyCTABar from '../StickyCTABar';
import Footer from '../Footer';
import { CallToActionBanner, ExclusiveDealsComponent, FourStepJourney, MeetTeam, StartupRegisterBanner } from './LandingPage';
import { motion } from 'framer-motion';
import TeamMember from '../TeamMember';
import Carousel from '@/components/Carousel';
import SearchFilters from '../SearchFilters';
import FAQ from '../FAQ';
import ProjectCard from '../ProjectCard';

interface ProjectData {

  id: string;
  title: string;
  description: string;
  fundRaised: string;
  stage: string;
  tags: string[];
  progress: number;
  rating: number;
  image?: string;
}


export default function Investor() {
     const [showMoreProjects, setShowMoreProjects] = useState(false);
      const [projects, setProjects] = useState<ProjectData[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
      const [showDetailsModal, setShowDetailsModal] = useState(false);
    
      // Fetch approved projects from API with comprehensive error handling
      const fetchApprovedProjects = async () => {
        try {
          setLoading(true);
          setError(null); // Clear any previous errors
          
          // Check if fetch is available
          if (typeof fetch === 'undefined') {
            throw new Error('Fetch API not available');
          }
          
          // Try multiple endpoints to get approved projects
          let response;
          let data;
          
          try {
            // Get backend URL based on environment
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
            const apiBase = import.meta.env.MODE === 'production' ? `${backendUrl}/api` : '/api';

            // First try the approved projects endpoint
            response = await fetch(`${apiBase}/projects/approved?limit=9`);
            if (!response.ok) {
              // Fallback to search endpoint with approved filter
              response = await fetch(`${apiBase}/projects/search?status=approved&limit=9`);
            }
            if (!response.ok) {
              // Final fallback to all projects endpoint
              response = await fetch(`${apiBase}/projects?status=approved&limit=9`);
            }
          } catch (fetchError) {
            throw new Error('Failed to connect to server');
          }
          
          if (!response) {
            throw new Error('No response received from server');
          }
          
          try {
            data = await response.json();
          } catch (parseError) {
            throw new Error('Invalid response format from server');
          }
          
          if (response.ok && (data.projects || data.data?.projects || Array.isArray(data))) {
            // Transform data to match ProjectCard interface with safe data handling
            const projectsArray = data.projects || data.data?.projects || (Array.isArray(data) ? data : []);
            const transformedProjects: ProjectData[] = projectsArray
              .map((project: any) => {
                try {
                  // Safe numeric conversion for funding
                  const currentFunding = parseFloat(project.current_funding) || 0;
                  const fundingInMillions = (currentFunding / 1000000).toFixed(2);
                  
                  // Safe tags processing
                  let tags: string[] = ['Startup']; // Default fallback
                  if (project.tagsArray && Array.isArray(project.tagsArray)) {
                    tags = project.tagsArray;
                  } else if (project.tags && typeof project.tags === 'string') {
                    try {
                      // Try parsing as JSON first
                      tags = JSON.parse(project.tags);
                    } catch {
                      // Fallback to comma-separated
                      tags = project.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
                    }
                  } else if (project.category && typeof project.category === 'string') {
                    tags = [project.category];
                  }
                  
                  return {
                    id: project.id || `project-${Date.now()}`,
                    title: project.title || 'Untitled Project',
                    description: project.description || 'No description available',
                    fundRaised: project.fundRaised || `$${fundingInMillions}M`,
                    stage: project.stage || 'Early Stage',
                    tags: tags,
                    progress: Math.max(0, Math.min(100, parseFloat(project.progress) || 0)),
                    rating: Math.max(0, Math.min(5, parseFloat(project.rating) || 5.0)),
                    image: (() => {
                      let imageUrl = project.image || project.image_url || project.logo_url;
                      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/placeholder')) {
                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://13.200.209.191:8080';
                        imageUrl = `${backendUrl}${imageUrl}`;
                      }
                      console.log(`[Homepage] Image URL for ${project.title}: ${imageUrl}`);
                      return imageUrl || '/placeholder.svg';
                    })()
                  };
                } catch (error) {
                  console.warn('Error transforming project:', project.id, error);
                  return null; // Filter out problematic projects
                }
              })
              .filter(Boolean) as ProjectData[]; // Remove null entries
            
            console.log('✅ Successfully loaded', transformedProjects.length, 'approved projects');
            setProjects(transformedProjects);
            setError(null);
          } else {
            // Handle cases where API responds but with no projects
            console.warn('API responded but no projects found. Response:', {
              status: response.status,
              data: data,
              hasProjects: !!data.projects,
              hasDataProjects: !!data.data?.projects,
              isArray: Array.isArray(data)
            });
            
            if (data && !data.projects && !data.data?.projects && !Array.isArray(data)) {
              setProjects([]);
              setError(null); // Not really an error, just no data
            } else {
              throw new Error(data?.error || data?.message || `Server error: ${response.status}`);
            }
          }
        } catch (err) {
          console.error('Error fetching projects:', err);
          const errorMessage = err instanceof Error ? err.message : 'Failed to load projects';
          setError(errorMessage);
          // Always ensure projects is an array to prevent UI crashes
          setProjects([]);
        } finally {
          setLoading(false);
        }
      };
    
      useEffect(() => {
        // Safely fetch projects on component mount
        const initializeProjects = async () => {
          try {
            await fetchApprovedProjects();
          } catch (error) {
            console.error('Failed to initialize projects:', error);
            // Ensure we still have a valid state even if initialization fails
            setLoading(false);
            setProjects([]);
            setError('Failed to initialize application');
          }
        };
        
        initializeProjects();
      }, []);
      
      const handleViewMoreProjects = () => {
        setShowMoreProjects(!showMoreProjects);
      };
    
      const handleJoinNow = () => {
        window.location.href = '/signup';
      };
    
      const handleViewAllCaseStudies = () => {
        alert('This would navigate to a page showing all case studies.');
        // In a real app: window.location.href = '/case-studies';
      };
    
      const handleViewProjectDetails = (project: ProjectData) => {
        setSelectedProject(project);
        setShowDetailsModal(true);
      };
    
      const handleCloseModal = () => {
        setShowDetailsModal(false);
        setSelectedProject(null);
      };
    
      
      // Calculate which projects to display
      const initialProjects = projects.slice(0, 6);
      const displayedProjects = showMoreProjects ? projects : initialProjects;
    

    return (
        <div className="bg-white overflow-x-hidden">
            <Header />

            <ExclusiveDealsComponent />
                 {/* Popular Projects Section */}
        <motion.section 
          id="projects"
          className="w-full py-16 bg-gradient-to-b from-white to-gray-50"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="container mx-auto px-4">
            <motion.h2 
              className="text-4xl md:text-5xl font-bold text-center text-[#212529] mb-8 font-inter"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Popular Projects
            </motion.h2>

            <SearchFilters />

            {/* Project Cards */}
            <div className="mt-8">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg h-64 w-full"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-600 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to load projects</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button 
                    onClick={fetchApprovedProjects}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : displayedProjects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No approved projects yet</h3>
                  <p className="text-gray-600">Projects need to be approved by admin to appear here.</p>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
                    <p className="text-blue-700">
                      <strong>For testing:</strong> Submit a project as project owner, then approve it in admin dashboard.
                    </p>
                    <button 
                      onClick={fetchApprovedProjects}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      disabled={loading}
                    >
                      {loading ? 'Loading...' : 'Refresh Projects'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayedProjects.map((project, index) => (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex justify-center"
                    >
                      <ProjectCard 
                        {...project} 
                        onViewDetails={() => handleViewProjectDetails(project)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            <motion.div 
              className="flex justify-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.button 
                onClick={handleViewMoreProjects}
                whileHover={{ scale: 1.02, boxShadow: "0 8px 16px rgba(37, 99, 235, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                className="bg-[#2C91D5] text-white px-8 py-3 rounded-xl text-[15px] font-semibold hover:bg-[#2475c2] transition-all duration-300 shadow-sm font-inter active:bg-[#1e6bb8]"
              >
                {showMoreProjects ? 'Show Less Projects' : 'View More Projects'}
              </motion.button>
            </motion.div>
          </div>
        </motion.section>
            <FourStepJourney />
            <StartupRegisterBanner/>
            {/* <MeetTeam /> */}
                <section className="w-full bg-white pt-6 pb-12">
          <div className="container mx-auto px-4">
            <FAQ />
          </div>
        </section>
            <Footer />
            <StickyCTABar />
        </div>
    );
}