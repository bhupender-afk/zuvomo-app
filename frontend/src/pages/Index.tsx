import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import SearchFilters from '@/components/SearchFilters';
import ProjectCard from '@/components/ProjectCard';
import ProjectDetailsModal from '@/components/ProjectDetailsModal';
import ProjectTable from '@/components/ProjectTable';
import ServiceCard from '@/components/ServiceCard';
import TeamMember from '@/components/TeamMember';
import TestimonialCard from '@/components/TestimonialCard';
import CaseStudyCard from '@/components/CaseStudyCard';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import Carousel from '@/components/Carousel';
import AnimatedCounter from '@/components/AnimatedCounter';
import StickyCTABar from '@/components/StickyCTABar';
import { MeetTeam } from '@/components/staticComponents/LandingPage';

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

const Index = () => {
  const PROJECTS_PER_PAGE = 3;
  const [visibleProjectsCount, setVisibleProjectsCount] = useState(PROJECTS_PER_PAGE);
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

        // First try the approved projects endpoint /approved
        response = await fetch(`${apiBase}/projects/approved?limit=9`);
        console.log("Response from /approved:", response);
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
    if (isShowingAll) {
      // Reset to initial count (View Less functionality)
      setVisibleProjectsCount(PROJECTS_PER_PAGE);
    } else {
      // Show more projects (increment by PROJECTS_PER_PAGE)
      setVisibleProjectsCount(prev => Math.min(prev + PROJECTS_PER_PAGE, projects.length));
    }
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
  const displayedProjects = projects.slice(0, visibleProjectsCount);
  const hasMoreProjects = visibleProjectsCount < projects.length;
  const isShowingAll = visibleProjectsCount >= projects.length;

  const servicesData = [
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/8ce8ef7ef8c4e0cabe8d01e9fdb2d1ccc5d95062?placeholderIfAbsent=true",
      title: "Full Stack Advisory",
      description: "You build, we take care of the rest until the end."
    },
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/07aec0b2d4b918e6cf8f8693d05dd64ddf9021ac?placeholderIfAbsent=true",
      title: "VC Funding",
      description: "Get funded by investors who fuel real growth."
    },
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/379ff523d56d512107ce8b080603ef92ecb938de?placeholderIfAbsent=true",
      title: "Marketing",
      description: "We build narratives and communities that last."
    },
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/d39452372f8ded7c2fd8ba119ddad5acb8b1ff3d?placeholderIfAbsent=true",
      title: "Liquidity/OTC",
      description: "Stay liquid, tradeable, and secure from day one."
    }
  ];

  const teamData = [
    {
      name: "Nikhil Sethi",
      role: "Director",
      description: "Successfully crowdfunded 100+ startups. Ex Bajaj Allianz, BlaBlaCar.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/7d0192e868781511256b405413a44ec3dd6bab77?placeholderIfAbsent=true",
      socialLinks: { linkedin: "https://www.linkedin.com/in/sethinik/", telegram: "https://t.me/nsethi" }
    },
    {
      name: "Vandana Khanna",
      role: "Project Manager",
      description: "Project Manager by title, Problem solver by nature.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/80e023fd16e317d90724e58651663bcfdb1d7c3a?placeholderIfAbsent=true",
      socialLinks: { linkedin: "https://in.linkedin.com/in/khanna-vandana", telegram: "https://t.me/vandana_khanna" }
    },
    {
      name: "Rajat Thapa",
      role: "Content Analyst",
      description: "Digital marketer with a flair for creating social media content.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/f9dad5498f2febd8444e5c9ccbf76e10cafba6d7?placeholderIfAbsent=true",
      socialLinks: { linkedin: "https://in.linkedin.com/in/rajat-thapa-655042181", telegram: "https://t.me/Rajat_zuvomo" }
    },
    {
      name: "Sarah Johnson",
      role: "Lead Developer",
      description: "Full-stack developer with 8+ years in blockchain and DeFi protocols.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/7d0192e868781511256b405413a44ec3dd6bab77?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "Michael Chen",
      role: "Investment Strategist",
      description: "Former Goldman Sachs analyst specializing in crypto investments and market analysis.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/80e023fd16e317d90724e58651663bcfdb1d7c3a?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      description: "Brand strategist who has scaled 50+ Web3 projects from idea to market leadership.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/f9dad5498f2febd8444e5c9ccbf76e10cafba6d7?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "David Kim",
      role: "Technical Advisor",
      description: "Blockchain architect with expertise in smart contracts and DeFi protocols.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/7d0192e868781511256b405413a44ec3dd6bab77?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    },
    {
      name: "Lisa Wang",
      role: "Community Manager",
      description: "Community growth specialist who has built engaged communities for major crypto projects.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/80e023fd16e317d90724e58651663bcfdb1d7c3a?placeholderIfAbsent=true",
      socialLinks: { linkedin: "#", telegram: "#" }
    }
  ];

  const testimonialsData = [
    {
      quote: "Nikhil It gave us the clarity we needed to move forward with our project",
      author: "Vulcan Forged",
      role: "Director",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/9a5e9915b662476f9c68ecc4e2c8c79a925ca813?placeholderIfAbsent=true"
    },
    {
      quote: "They were able to see what was needed and where to begin in the first place.",
      author: "Morpheus Network",
      role: "CO & Founder",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/9dff43610f1657a2137a23d3ac72a7125c2c019b?placeholderIfAbsent=true"
    },
    {
      quote: "They understand both what we're building and who it’s for, and that matters.",
      author: "Landshare",
      role: "CEO & Co-Founder",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/9a5e9915b662476f9c68ecc4e2c8c79a925ca813?placeholderIfAbsent=true"
    },
    {
      quote: "The team's expertise in blockchain and DeFi helped us navigate complex technical challenges with confidence.",
      author: "Marcus Chen",
      role: "CTO",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/9dff43610f1657a2137a23d3ac72a7125c2c019b?placeholderIfAbsent=true"
    },
    {
      quote: "Outstanding results! They connected us with the right investors and helped secure our Series A funding.",
      author: "Elena Rodriguez",
      role: "Founder",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/9a5e9915b662476f9c68ecc4e2c8c79a925ca813?placeholderIfAbsent=true"
    }
  ];

  const caseStudiesData = [
    {
      title: "RWA vs. DeFi vs. DePIN vs. AI: Who's Winning the 2025 VC Funding War?",
      description: "The first half of 2025 marked a pivotal period for crypto venture capital, demonstrating a discernible rebound in total funding that collectively surpassed the total funding figures for the entirety of 2024.",
      category: "Market Analysis",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/635f795a41e7888f3faced2e318107315cec1614?placeholderIfAbsent=true",
      slug: "rwa-defi-depin-ai-2025-vc-funding-war"
    },
    {
      title: "Why 70% Public Companies, Michael Saylor's Strategy, and Holding $67 Billion of BTC",
      description: "An in-depth analysis of corporate Bitcoin adoption strategies and Michael Saylor's approach to holding $67 billion in BTC reserves.",
      category: "Bitcoin Strategy",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/db2a5a72c9699d26dddbba5248a2f725a6452ea6?placeholderIfAbsent=true",
      slug: "michael-saylor-bitcoin-strategy-67-billion"
    },
    {
      title: "How 4 Crypto Narratives Fueled a $13 Billion Dollar Fundraising Resurgence in 2024",
      description: "Exploring the four key crypto narratives that drove a massive $13 billion fundraising resurgence throughout 2024.",
      category: "Crypto Trends",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/a2e55bec0ca00b57ad8940c86cf6c1d6e9e16893?placeholderIfAbsent=true",
      slug: "crypto-narratives-13-billion-fundraising-2024"
    }
  ];

  return (
    <div className="bg-white overflow-x-hidden">
      <Header />
      
      <main>
        <Hero />
        
        {/* Popular Projects Section */}
        {/* <motion.section 
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
            
            {projects.length > PROJECTS_PER_PAGE && (
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
                  {isShowingAll ? 'View Less Projects' : 'View More Projects'}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.section> */}

      

        {/* Successful Project Launches Section */}
        <section className="w-full py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-8 font-inter leading-tight">
              Successful Project Launches
            </h2>
            
            <ProjectTable />
            
            {/* Smart Services Section */}
            <div className="mt-16">
              <h2 id="services" className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-8 font-inter leading-tight">
                Smart Services for Startup Success
              </h2>
              
              {/* Services with Handshake Image */}
              <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-8">
                {/* Handshake Image */}
                {/* <div className="w-full lg:w-1/3 flex justify-center">
                  <img
                    src="/handshake.png"
                    className="w-full max-w-[300px] h-auto object-contain"
                    alt="Partnership and collaboration"
                  />
                </div> */}
                
                {/* Services Grid */}
                <div className="w-full lg:w- 4/4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4  gap-6 justify-items-center">
                    {servicesData.map((service, index) => (
                      <ServiceCard key={index} {...service} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

          {/* In The News Section */}
        <section className="w-full bg-[#F6F7FA] py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-10 font-inter leading-tight">
              In The News
            </h2>
            
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/cc95740ca28db7fc39e20601cc3afc030133498f?placeholderIfAbsent=true"
                className="h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/bebd155ece411431e9f6ab55893e73d66022da59?placeholderIfAbsent=true"
                className="h-10 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/2d53b2539cdd551f17a435906deaf8db10b7d759?placeholderIfAbsent=true"
                className="h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/d76717f35a07bd2bedfb7481cfdab0c7f9ce50d2?placeholderIfAbsent=true"
                className="h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/57eddc4281d393a4b2deb2447243e5ee199a259c?placeholderIfAbsent=true"
                className="h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12 mt-6">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/2e78ffe82ec17f63f9ca27386ded03022e92b08d?placeholderIfAbsent=true"
                className="h-16 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/6d548a92b4185947a5734467a245221e27633369?placeholderIfAbsent=true"
                className="h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/6c221620bd198b674e1e1cf2308f89670361f63f?placeholderIfAbsent=true"
                className="h-12 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/1a1d94d222b6ad304265e0a5a5cb5825b9b265e2?placeholderIfAbsent=true"
                className="h-10 w-auto object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                alt="News logo"
              />
            </div>
          </div>
        </section>

        {/* Journey Steps Section */}
        <section className="w-full bg-white py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-10 font-inter leading-tight">
              Kick Start Your Journey In 4 Steps
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12 mt-12">
              {[
                {
                  icon: "https://api.builder.io/api/v1/image/assets/TEMP/e883190a4a32bc3bb9f0f7990d5d728ec18cba35?placeholderIfAbsent=true",
                  title: "Sign Up",
                  description: "Register to access our funding networks, growth playbooks, and expert advisors."
                },
                {
                  icon: "https://api.builder.io/api/v1/image/assets/TEMP/7b5f607f90d1e3d81bacd09de2499fd130e517d2?placeholderIfAbsent=true",
                  title: "Get your Startup Evaluated",
                  description: "Find gaps, gain expert insights, and unlock your startup's potential."
                },
                {
                  icon: "https://api.builder.io/api/v1/image/assets/TEMP/110e2d29ecc9cf35bcec6c11093175602d08599b?placeholderIfAbsent=true",
                  title: "Connect with Startup Investors Experts",
                  description: "Get access to 1,000+ Startup Investors for mentorship, strategic deals, and capital."
                },
                {
                  icon: "https://api.builder.io/api/v1/image/assets/TEMP/9aa02c702a857b7f5d105cf40d2612fd6d2749a6?placeholderIfAbsent=true",
                  title: "Plot your Journey",
                  description: "Build a roadmap for scaling your business from partnerships to expansion."
                }
              ].map((step, index) => (
                <article key={index} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 mb-4">
                    <img
                      src={step.icon}
                      className="w-full h-full object-contain"
                      alt={`${step.title} icon`}
                    />
                  </div>
                  <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-2 font-inter">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#6b7280] leading-relaxed font-inter">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
            
            <div className="flex justify-center mt-10">
              <button 
                onClick={handleJoinNow}
                className="px-12 py-3 text-base text-[#2C91D5] font-medium border border-[#2C91D5] rounded-full  hover:bg-[rgb(30,120,180)] hover:text-white transition-all duration-200"
              >
                JOIN NOW
              </button>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="relative w-full min-h-[372px] text-white text-center overflow-hidden">
          <img
            src="https://api.builder.io/api/v1/image/assets/TEMP/339241271433362ccd9c7387d7feb41fb9071adf?placeholderIfAbsent=true"
            className="absolute h-full w-full object-cover inset-0"
            alt="Background"
          />
          <div className="relative container mx-auto px-4 py-12">
            <h2 className="text-[32px] md:text-[36px] font-bold leading-tight max-w-3xl mx-auto mb-12 font-inter">
              We Work Around The Clock, So You Can Focus On Your Product
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-4">
              {[
                { value: 800, suffix: "M+", prefix: "$", label: "raised by startups" },
                { value: 150, suffix: "+", prefix: "", label: "successful startup founders funded" },
                { value: 100, suffix: "+", prefix: "", label: "top-tier investors onboard" }
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="text-center flex flex-col justify-center h-full min-h-[120px]">
                    <div className="text-4xl md:text-5xl font-bold mb-2">
                      <AnimatedCounter
                        end={stat.value}
                        suffix={stat.suffix}
                        prefix={stat.prefix}
                        duration={2.5}
                      />
                    </div>
                    <div className="text-[15px] italic font-light">
                      {stat.label}
                    </div>
                  </div>
                  {index < 2 && (
                    <motion.div 
                      className="hidden sm:block absolute right-0 top-0 bottom-0 flex items-center"
                      initial={{ opacity: 0, scaleY: 0 }}
                      whileInView={{ opacity: 1, scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    >
                      <img 
                        src="/separator.png" 
                        alt="separator" 
                        className="h-full w-auto object-fill min-h-[100px]"
                      />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-[#F6FBFF] py-8 lg:py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="w-full lg:w-1/2 text-center lg:text-left">
                <h2 className="text-[24px] sm:text-[32px] lg:text-[40px] font-bold leading-tight mb-4 lg:mb-6 font-inter">
                  <span className="text-[#0b0720]">Backed 100+ </span>
                  <span className="text-[#2C91D5] font-bold">Startups,</span>
                  <br />
                  <span className="text-[#0b0720]">Since 2017</span>
                </h2>
                
                <p className="text-[14px] sm:text-[16px] text-[#4b5563] mb-6 lg:mb-8 font-inter leading-relaxed max-w-md mx-auto lg:mx-0">
                  Plug into a battle-tested network of founders,<br className="hidden lg:block" />
                  investors, and strategists for real outcomes.
                </p>
                
                <button 
                  onClick={handleJoinNow}
                  className="bg-[#2C91D5] text-white px-8 sm:px-12 py-3 rounded-full text-sm sm:text-base font-medium hover:opacity-90 transition-all duration-200"
                >
                  JOIN NOW
                </button>
              </div>
              
              <div className="w-full lg:w-1/2 flex justify-center items-center px-2">
                <img
                  src="/3x.png"
                  className="w-full max-w-[400px] sm:max-w-[500px] lg:max-w-[600px] h-auto object-contain"
                  alt="Client logos"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
       <MeetTeam/>

        {/* Testimonials Section */}
        <section className="w-full bg-[#F6FBFF] py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-[32px] md:text-[36px] font-bold mb-5 font-inter leading-tight">
                <span className="text-[#1c1c1c]">What Our Customers Feel About </span>
                <span className="text-[#2C91D5]">Zuvomo</span>
              </h2>
              
              <p className="text-[16px] text-[#6b7280] leading-relaxed max-w-2xl mx-auto font-inter">
                Empower the best startup founders with funding, talent, and growth opportunities. Our platform connects innovative entrepreneurs with the resources they need to scale and succeed.
              </p>
            </div>
            
            {/* Mobile: Simple grid, Tablet/Desktop: Carousel */}
            <div className="block lg:hidden">
              <div className="grid grid-cols-1 gap-6 max-w-lg mx-auto">
                {testimonialsData.slice(0, 3).map((testimonial, index) => (
                  <TestimonialCard key={index} {...testimonial} />
                ))}
              </div>
            </div>
            
            <div className="hidden lg:block">
              <Carousel
                itemsPerView={2}
                gap={20}
                showArrows={true}
                showDots={true}
                autoPlay={true}
                autoPlayInterval={5000}
              >
                {testimonialsData.map((testimonial, index) => (
                  <div key={index} className="px-2">
                    <TestimonialCard {...testimonial} />
                  </div>
                ))}
              </Carousel>
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        {/* <section id="case-studies" className="w-full pt-12 pb-6">
          <div className="container mx-auto px-4">
            <h2 className="text-[32px] md:text-[36px] font-bold text-center text-[#1d1d1d] mb-4 font-inter leading-tight">
              Case Studies
            </h2>
            
            <p className="text-[16px] text-[#6b7280] text-center max-w-3xl mx-auto mb-8 font-inter leading-relaxed">
              We have helped 100+ startups secure over $800 Million in investments. Read these case studies to discover our growth and funding strategies.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {caseStudiesData.map((caseStudy, index) => (
                <CaseStudyCard key={index} {...caseStudy} />
              ))}
            </div>
            
           
          </div>
        </section> */}

        {/* FAQ Section */}
        <section className="w-full bg-white pt-6 pb-12">
          <div className="container mx-auto px-4">
            <FAQ />
          </div>
        </section>
      </main>

      <Footer />
      <StickyCTABar />

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
            // Additional details for comprehensive modal
            id: selectedProject.id,
            location: 'San Francisco, CA', // TODO: Get from backend
            teamSize: 5, // TODO: Get from backend
            fundingGoal: '$500,000', // TODO: Get from backend
            industry: selectedProject.tags[0] || 'Technology',
            valuation: '$2,000,000', // TODO: Get from backend
            ownerName: 'Project Owner', // TODO: Get from backend
            ownerCompany: 'Startup Inc', // TODO: Get from backend
            ratingCount: 25 // TODO: Get from backend
          }}
          isOpen={showDetailsModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Index;
