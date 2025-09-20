import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building,
  Calendar,
  Clock,
  Eye,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  Quote,
  TrendingUp,
  Target,
  CheckCircle,
  Users,
  MapPin,
  Award,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  content?: string;
  featured_image?: string;
  company_logo?: string;
  testimonial?: string;
  testimonial_author?: string;
  testimonial_position?: string;
  metrics: Record<string, string>;
  tags: string[];
  views: number;
  is_featured: boolean;
  completion_date?: string;
  project_duration?: string;
  created_at: string;
}

interface RelatedCaseStudy {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  industry?: string;
  featured_image?: string;
  company_logo?: string;
}

const CaseStudy: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [relatedCaseStudies, setRelatedCaseStudies] = useState<RelatedCaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchCaseStudy(slug);
    }
  }, [slug]);

  const fetchCaseStudy = async (caseSlug: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get(`/case-studies/${caseSlug}`);

      if (response.data?.success) {
        setCaseStudy(response.data.data.case_study);
        setRelatedCaseStudies(response.data.data.related || []);
      } else {
        setError('Case study not found');
      }
    } catch (error: any) {
      console.error('Error fetching case study:', error);
      if (error.response?.status === 404) {
        setError('Case study not found');
      } else {
        setError('Failed to load case study');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = caseStudy?.title || '';

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);

    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl);
        return;
    }

    window.open(shareLink, '_blank', 'width=600,height=400');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !caseStudy) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-600 mb-4">
              {error || 'Case study not found'}
            </h1>
            <p className="text-gray-500 mb-8">
              The case study you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/case-studies">
              <Button className="bg-green-600 hover:bg-green-700">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Case Studies
              </Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b" >
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-green-600">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/case-studies" className="text-gray-500 hover:text-green-600">
              Case Studies
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 truncate">{caseStudy.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">

          {/* Back to Case Studies */}
          <Link
            to="/case-studies"
            className="inline-flex items-center text-green-600 hover:text-green-700 mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Case Studies
          </Link>

          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            {caseStudy.featured_image && (
              <div className="h-64 md:h-96 overflow-hidden relative">
                <img
                  src={caseStudy.featured_image}
                  alt={caseStudy.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-end">
                  <div className="p-8 text-white">
                    <div className="flex items-center gap-4 mb-4">
                      {caseStudy.company_logo ? (
                        <img
                          src={caseStudy.company_logo}
                          alt={caseStudy.company_name}
                          className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                          <Building className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-2xl font-bold">{caseStudy.company_name}</h2>
                        {caseStudy.industry && (
                          <p className="text-lg opacity-90">{caseStudy.industry}</p>
                        )}
                      </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                      {caseStudy.title}
                    </h1>
                  </div>
                </div>
              </div>
            )}

            {!caseStudy.featured_image && (
              <div className="p-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <div className="flex items-center gap-4 mb-6">
                  {caseStudy.company_logo ? (
                    <img
                      src={caseStudy.company_logo}
                      alt={caseStudy.company_name}
                      className="w-16 h-16 object-contain bg-white rounded-lg p-2"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{caseStudy.company_name}</h2>
                    {caseStudy.industry && (
                      <p className="text-lg opacity-90">{caseStudy.industry}</p>
                    )}
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                  {caseStudy.title}
                </h1>
              </div>
            )}

            {/* Meta Information */}
            <div className="p-8 border-b">
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                {caseStudy.completion_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>Completed {formatDate(caseStudy.completion_date)}</span>
                  </div>
                )}
                {caseStudy.project_duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{caseStudy.project_duration}</span>
                  </div>
                )}
                {caseStudy.company_size && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{caseStudy.company_size}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{caseStudy.views.toLocaleString()} views</span>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-4 mt-6">
                <span className="text-gray-600 font-medium">Share:</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="text-blue-400 border-blue-400 hover:bg-blue-50"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('linkedin')}
                    className="text-blue-700 border-blue-700 hover:bg-blue-50"
                  >
                    <Linkedin className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('copy')}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Content Column */}
            <div className="lg:col-span-2 space-y-8">

              {/* Challenge */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold">The Challenge</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{caseStudy.challenge}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Solution */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold">Our Solution</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{caseStudy.solution}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">The Results</h2>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">{caseStudy.results}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Content */}
              {caseStudy.content && (
                <Card>
                  <CardContent className="p-8">
                    <div
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ __html: caseStudy.content }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Testimonial */}
              {caseStudy.testimonial && (
                <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-8">
                    <div className="flex items-start gap-4">
                      <Quote className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-lg text-gray-700 italic mb-4">
                          "{caseStudy.testimonial}"
                        </p>
                        {(caseStudy.testimonial_author || caseStudy.testimonial_position) && (
                          <div className="text-sm text-gray-600">
                            <div className="font-semibold">{caseStudy.testimonial_author}</div>
                            <div>{caseStudy.testimonial_position}</div>
                            <div>{caseStudy.company_name}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Key Metrics */}
              {caseStudy.metrics && Object.keys(caseStudy.metrics).length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Award className="w-5 h-5 text-green-600" />
                      Key Results
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(caseStudy.metrics).map(([key, value]) => (
                        <div key={key} className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{value}</div>
                          <div className="text-sm text-gray-600 capitalize">
                            {key.replace(/_/g, ' ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Details */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Project Details</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-semibold">{caseStudy.company_name}</span>
                    </div>
                    {caseStudy.industry && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Industry:</span>
                        <span className="font-semibold">{caseStudy.industry}</span>
                      </div>
                    )}
                    {caseStudy.company_size && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Company Size:</span>
                        <span className="font-semibold">{caseStudy.company_size}</span>
                      </div>
                    )}
                    {caseStudy.project_duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{caseStudy.project_duration}</span>
                      </div>
                    )}
                    {caseStudy.completion_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-semibold">{formatDate(caseStudy.completion_date)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tags */}
              {caseStudy.tags && caseStudy.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Tags</h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {caseStudy.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-green-600 border-green-600">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CTA */}
              <Card className="bg-gradient-to-br from-green-600 to-emerald-600 text-white">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready for Similar Results?</h3>
                  <p className="text-sm mb-4 opacity-90">
                    Let us help you achieve your funding goals just like {caseStudy.company_name}.
                  </p>
                  <Button className="w-full bg-white text-green-600 hover:bg-gray-100">
                    Get Started Today
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Case Studies */}
          {relatedCaseStudies.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Success Stories</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedCaseStudies.map((relatedCase) => (
                  <Card key={relatedCase.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {relatedCase.featured_image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={relatedCase.featured_image}
                          alt={relatedCase.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-3">
                        {relatedCase.company_logo ? (
                          <img
                            src={relatedCase.company_logo}
                            alt={relatedCase.company_name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                            <Building className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{relatedCase.company_name}</div>
                          {relatedCase.industry && (
                            <div className="text-sm text-gray-500">{relatedCase.industry}</div>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                        <Link
                          to={`/case-studies/${relatedCase.slug}`}
                          className="hover:text-green-600 transition-colors"
                        >
                          {relatedCase.title}
                        </Link>
                      </h3>
                      <Link
                        to={`/case-studies/${relatedCase.slug}`}
                        className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1"
                      >
                        Read Story <ChevronRight className="w-4 h-4" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CaseStudy;