import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Building, 
  Calendar, 
  TrendingUp, 
  ChevronRight, 
  Award,
  Filter,
  MapPin,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../services/api';

interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  industry?: string;
  company_size?: string;
  challenge: string;
  solution: string;
  results: string;
  featured_image?: string;
  company_logo?: string;
  metrics: Record<string, string>;
  tags: string[];
  views: number;
  is_featured: boolean;
  completion_date?: string;
  project_duration?: string;
  created_at: string;
}

interface Industry {
  industry: string;
  count: number;
}

const CaseStudies: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedIndustry, setSelectedIndustry] = useState(searchParams.get('industry') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [featuredCaseStudies, setFeaturedCaseStudies] = useState<CaseStudy[]>([]);

  // Fetch case studies
  const fetchCaseStudies = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedIndustry && { industry: selectedIndustry }),
        ...(selectedTag && { tag: selectedTag })
      });

      const response = await api.get(`/case-studies?${params}`);
      
      if (response.data?.success) {
        setCaseStudies(response.data.data.case_studies);
        setTotalPages(response.data.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching case studies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured case studies
  const fetchFeaturedCaseStudies = async () => {
    try {
      const response = await api.get('/case-studies?featured=true&limit=3');
      if (response.data?.success) {
        setFeaturedCaseStudies(response.data.data.case_studies);
      }
    } catch (error) {
      console.error('Error fetching featured case studies:', error);
    }
  };

  // Fetch industries
  const fetchIndustries = async () => {
    try {
      const response = await api.get('/case-studies/filters/industries');
      if (response.data?.success) {
        setIndustries(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching industries:', error);
    }
  };

  useEffect(() => {
    fetchCaseStudies();
    fetchFeaturedCaseStudies();
    fetchIndustries();
  }, []);

  useEffect(() => {
    fetchCaseStudies(1);
  }, [searchTerm, selectedIndustry, selectedTag]);

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    if (selectedTag) params.set('tag', selectedTag);
    setSearchParams(params);
    fetchCaseStudies(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCaseStudies(page);
    window.scrollTo(0, 0);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get key metric from metrics object
  const getKeyMetric = (metrics: Record<string, string>) => {
    const keys = Object.keys(metrics);
    if (keys.length === 0) return null;
    
    // Prioritize certain metrics
    const priorityKeys = ['funding_raised', 'roi', 'growth', 'revenue_increase'];
    const priorityKey = priorityKeys.find(key => keys.includes(key));
    const metricKey = priorityKey || keys[0];
    
    return {
      label: metricKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: metrics[metricKey]
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Success Stories</h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Discover how we've helped startups and businesses achieve remarkable growth through strategic funding and expert guidance
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search case studies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 py-3 text-lg"
                />
              </div>
              <Button onClick={handleSearch} size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">$50M+</div>
              <div className="text-gray-600">Total Funding Raised</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">200+</div>
              <div className="text-gray-600">Success Stories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-gray-600">Client Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">15+</div>
              <div className="text-gray-600">Industries Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Case Studies */}
      {featuredCaseStudies.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Success Stories</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredCaseStudies.map((caseStudy) => (
                <Card key={caseStudy.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {caseStudy.featured_image && (
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={caseStudy.featured_image}
                        alt={caseStudy.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <Badge className="absolute top-4 left-4 bg-green-600 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {caseStudy.company_logo ? (
                        <img
                          src={caseStudy.company_logo}
                          alt={caseStudy.company_name}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Building className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-lg">{caseStudy.company_name}</h3>
                        {caseStudy.industry && (
                          <p className="text-sm text-gray-500">{caseStudy.industry}</p>
                        )}
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-semibold mb-3 line-clamp-2">
                      <Link
                        to={`/case-studies/${caseStudy.slug}`}
                        className="hover:text-green-600 transition-colors"
                      >
                        {caseStudy.title}
                      </Link>
                    </h4>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">{caseStudy.challenge}</p>
                    
                    {/* Key Metric */}
                    {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        {(() => {
                          const keyMetric = getKeyMetric(caseStudy.metrics);
                          return keyMetric ? (
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{keyMetric.value}</div>
                              <div className="text-sm text-gray-600">{keyMetric.label}</div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                    
                    <Link
                      to={`/case-studies/${caseStudy.slug}`}
                      className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                    >
                      Read Full Story <ChevronRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content */}
          <div className="lg:w-3/4">
            
            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="border rounded-md px-3 py-2 min-w-48"
                >
                  <option value="">All Industries</option>
                  {industries.map((industry) => (
                    <option key={industry.industry} value={industry.industry}>
                      {industry.industry} ({industry.count})
                    </option>
                  ))}
                </select>
                
                {selectedTag && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {selectedTag}
                    <button
                      onClick={() => setSelectedTag('')}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>

            {/* Case Studies Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : caseStudies.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {caseStudies.map((caseStudy) => (
                    <Card key={caseStudy.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {caseStudy.featured_image && (
                        <div className="h-48 overflow-hidden relative">
                          <img
                            src={caseStudy.featured_image}
                            alt={caseStudy.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          {caseStudy.is_featured && (
                            <Badge className="absolute top-4 left-4 bg-green-600 text-white">
                              <Award className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      )}
                      <CardContent className="p-6">
                        {/* Company Info */}
                        <div className="flex items-center gap-3 mb-4">
                          {caseStudy.company_logo ? (
                            <img
                              src={caseStudy.company_logo}
                              alt={caseStudy.company_name}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-lg">{caseStudy.company_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {caseStudy.industry && (
                                <span className="flex items-center gap-1">
                                  <Building className="w-3 h-3" />
                                  {caseStudy.industry}
                                </span>
                              )}
                              {caseStudy.company_size && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {caseStudy.company_size}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <h4 className="text-xl font-semibold mb-3 line-clamp-2">
                          <Link
                            to={`/case-studies/${caseStudy.slug}`}
                            className="hover:text-green-600 transition-colors"
                          >
                            {caseStudy.title}
                          </Link>
                        </h4>
                        
                        <p className="text-gray-600 mb-4 line-clamp-3">{caseStudy.challenge}</p>
                        
                        {/* Project Details */}
                        <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                          {caseStudy.project_duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {caseStudy.project_duration}
                            </span>
                          )}
                          {caseStudy.completion_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(caseStudy.completion_date)}
                            </span>
                          )}
                        </div>
                        
                        {/* Key Metrics */}
                        {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(caseStudy.metrics).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className="text-lg font-bold text-green-600">{value}</div>
                                  <div className="text-xs text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Tags */}
                        {caseStudy.tags && caseStudy.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {caseStudy.tags.slice(0, 3).map((tag, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedTag(tag)}
                                className="text-xs text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <Link
                          to={`/case-studies/${caseStudy.slug}`}
                          className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                        >
                          Read Full Story <ChevronRight className="w-4 h-4" />
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => handlePageChange(page)}
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No case studies found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-8 space-y-6">
              
              {/* Industries */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Industries</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedIndustry('')}
                      className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                        !selectedIndustry 
                          ? 'bg-green-600 text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      All Industries
                    </button>
                    {industries.slice(0, 8).map((industry) => (
                      <button
                        key={industry.industry}
                        onClick={() => setSelectedIndustry(industry.industry)}
                        className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                          selectedIndustry === industry.industry
                            ? 'bg-green-600 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{industry.industry}</span>
                          <span className="text-sm opacity-75">({industry.count})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Grow?</h3>
                  <p className="text-sm mb-4 opacity-90">
                    Join hundreds of successful startups that have achieved their funding goals with Zuvomo.
                  </p>
                  <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                    Start Your Journey
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CaseStudies;