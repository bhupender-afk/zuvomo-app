import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Eye, User, Tag, Edit3, X } from 'lucide-react';

interface BlogViewModalProps {
  blog: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const BlogViewModal: React.FC<BlogViewModalProps> = ({ blog, isOpen, onClose, onEdit }) => {
  if (!blog) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tags = Array.isArray(blog.tags) ? blog.tags : (typeof blog.tags === 'string' ? JSON.parse(blog.tags || '[]') : []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
          <div className="flex-1">
            <DialogTitle className="text-2xl font-bold text-gray-900 pr-8">
              {blog.title}
            </DialogTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{blog.author_first_name} {blog.author_last_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(blog.created_at)}</span>
              </div>
              {blog.views && (
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{blog.views} views</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Featured */}
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(blog.status)}>
              {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
            </Badge>
            {(blog.is_featured || blog.featured) && (
              <Badge variant="secondary">
                Featured
              </Badge>
            )}
          </div>

          {/* Featured Image */}
          {blog.featured_image && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Featured Image</h3>
              <img
                src={blog.featured_image}
                alt={blog.title}
                className="w-full max-h-80 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Excerpt */}
          {blog.excerpt && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Excerpt</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg italic">
                {blog.excerpt}
              </p>
            </div>
          )}

          <Separator />

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">Content</h3>
            <div
              className="prose max-w-none text-gray-700 bg-white p-6 rounded-lg border"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>

          <Separator />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* SEO Metadata */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900">SEO Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Meta Title</h4>
                <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {blog.meta_title || blog.title || 'Not set'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-1">Meta Description</h4>
                <p className="text-sm text-gray-600 bg-white p-2 rounded border">
                  {blog.meta_description || blog.excerpt || 'Not set'}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Created:</span> {formatDate(blog.created_at)}
              </div>
              {blog.updated_at && (
                <div>
                  <span className="font-medium">Updated:</span> {formatDate(blog.updated_at)}
                </div>
              )}
              {blog.published_at && (
                <div>
                  <span className="font-medium">Published:</span> {formatDate(blog.published_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlogViewModal;