import React from 'react';
import { Calendar, Eye, Building2, Globe, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CaseStudy {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  featured_image?: string;
  company_logo?: string;
  company_name: string;
  industry: string;
  project_duration?: string;
  technologies_used?: string;
  results_achieved?: string;
  client_testimonial?: string;
  is_featured: boolean;
  views: number;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  publish_date?: string;
}

interface CaseStudyViewModalProps {
  caseStudy: CaseStudy;
  isOpen: boolean;
  onClose: () => void;
}

const CaseStudyViewModal: React.FC<CaseStudyViewModalProps> = ({
  caseStudy,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTechnologies = (tech: string) => {
    if (!tech) return [];
    return tech.split(',').map(t => t.trim()).filter(Boolean);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white -m-6 p-6 mb-6 rounded-t-lg">
          <DialogTitle className="text-2xl font-bold">Case Study Details</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6">
            {/* Featured Image */}
            {caseStudy.featured_image && (
              <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={caseStudy.featured_image}
                  alt={caseStudy.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Title and Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {caseStudy.title}
                </h1>
                <p className="text-lg text-gray-600">
                  {caseStudy.description}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2 ml-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  caseStudy.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {caseStudy.status === 'published' ? 'Published' : 'Draft'}
                </span>
                {caseStudy.is_featured && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Featured
                  </span>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-center space-x-4 mb-4">
                {caseStudy.company_logo && (
                  <img
                    src={caseStudy.company_logo}
                    alt={caseStudy.company_name}
                    className="w-16 h-16 rounded-lg object-contain bg-white p-2"
                  />
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    {caseStudy.company_name}
                  </h3>
                  <p className="text-gray-600">{caseStudy.industry}</p>
                </div>
              </div>
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration */}
              {caseStudy.project_duration && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                    Project Duration
                  </h4>
                  <p className="text-gray-700">{caseStudy.project_duration}</p>
                </div>
              )}

              {/* Views */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-blue-600" />
                  Views
                </h4>
                <p className="text-gray-700">{caseStudy.views.toLocaleString()}</p>
              </div>
            </div>

            {/* Technologies Used */}
            {caseStudy.technologies_used && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Globe className="w-4 h-4 mr-2 text-blue-600" />
                  Technologies Used
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formatTechnologies(caseStudy.technologies_used).map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Case Study Content</h4>
              <div
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: caseStudy.content }}
              />
            </div>

            {/* Results Achieved */}
            {caseStudy.results_achieved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3">Results Achieved</h4>
                <div
                  className="text-green-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: caseStudy.results_achieved }}
                />
              </div>
            )}

            {/* Client Testimonial */}
            {caseStudy.client_testimonial && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">Client Testimonial</h4>
                <blockquote className="text-blue-800 italic leading-relaxed">
                  "{caseStudy.client_testimonial}"
                </blockquote>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span><br />
                  {formatDate(caseStudy.created_at)}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span><br />
                  {formatDate(caseStudy.updated_at)}
                </div>
                {caseStudy.publish_date && (
                  <div>
                    <span className="font-medium">Published:</span><br />
                    {formatDate(caseStudy.publish_date)}
                  </div>
                )}
              </div>
            </div>

            {/* Slug Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">URL Slug:</span>
                  <code className="ml-2 px-2 py-1 bg-gray-200 rounded text-sm">
                    /case-studies/{caseStudy.slug}
                  </code>
                </div>
                <button className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Public Page
                </button>
              </div>
            </div>
          </div>
      
      </DialogContent>
    </Dialog>
  );
};

export default CaseStudyViewModal;