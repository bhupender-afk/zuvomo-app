import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Clock, 
  Eye, 
  Share2, 
  Facebook, 
  Twitter, 
  Linkedin,
  ChevronLeft,
  ChevronRight,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Header from '../components/Header';
import Footer from '../components/Footer';
import api from '../services/api';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  tags: string[];
  views: number;
  is_featured: boolean;
  publish_date: string;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  author_first_name: string;
  author_last_name: string;
  author_image?: string;
  author_bio?: string;
}

interface RelatedBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  publish_date: string;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<RelatedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchBlogPost(slug);
    }
  }, [slug]);

  const fetchBlogPost = async (postSlug: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/blogs/${postSlug}`);
      
      if (response.data?.success) {
        setBlog(response.data.data.blog);
        setRelatedBlogs(response.data.data.related || []);
        
        // Update page metadata
        if (response.data.data.blog.meta_title) {
          document.title = response.data.data.blog.meta_title;
        }
        
        if (response.data.data.blog.meta_description) {
          let metaDescription = document.querySelector('meta[name="description"]');
          if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
          }
          metaDescription.setAttribute('content', response.data.data.blog.meta_description);
        }
      } else {
        setError('Blog post not found');
      }
    } catch (error: any) {
      console.error('Error fetching blog post:', error);
      if (error.response?.status === 404) {
        setError('Blog post not found');
      } else {
        setError('Failed to load blog post');
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

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = blog?.title || '';

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C91D5]"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-600 mb-4">
              {error || 'Blog post not found'}
            </h1>
            <p className="text-gray-500 mb-8">
              The blog post you're looking for doesn't exist or has been moved.
            </p>
            <Link to="/blog">
              <Button className="bg-[#2C91D5] hover:bg-blue-700">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Blog
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
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-[#2C91D5]">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link to="/blog" className="text-gray-500 hover:text-[#2C91D5]">
              Blog
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 truncate">{blog.title}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Back to Blog */}
          <Link 
            to="/blog"
            className="inline-flex items-center text-[#2C91D5] hover:text-blue-700 mb-8 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <article className="bg-white rounded-lg shadow-sm overflow-hidden">
            {blog.featured_image && (
              <div className="h-64 md:h-96 overflow-hidden">
                <img
                  src={blog.featured_image}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-8">
              {/* Tags and Featured Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {blog.is_featured && (
                  <Badge className="bg-[#2C91D5] text-white">Featured</Badge>
                )}
                {blog.tags && blog.tags.length > 0 && (
                  <>
                    {blog.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-[#2C91D5] border-[#2C91D5]">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {blog.title}
              </h1>

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 mb-8 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDate(blog.publish_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{calculateReadingTime(blog.content)} min read</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{blog.views.toLocaleString()} views</span>
                </div>
              </div>

              {/* Author Info */}
              {/* <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="w-16 h-16 bg-[#2C91D5] rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {blog.author_first_name[0]}{blog.author_last_name[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {blog.author_first_name} {blog.author_last_name}
                  </div>
                  {blog.author_bio && (
                    <p className="text-gray-600 text-sm">{blog.author_bio}</p>
                  )}
                </div>
              </div> */}

              {/* Share Buttons */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b">
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

              {/* Article Content */}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>
          </article>

          {/* Related Articles */}
          {relatedBlogs.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Card key={relatedBlog.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {relatedBlog.featured_image && (
                      <div className="h-48 overflow-hidden">
                        <img
                          src={relatedBlog.featured_image}
                          alt={relatedBlog.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {formatDate(relatedBlog.publish_date)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-3 line-clamp-2">
                        <Link
                          to={`/blog/${relatedBlog.slug}`}
                          className="hover:text-[#2C91D5] transition-colors"
                        >
                          {relatedBlog.title}
                        </Link>
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-3">{relatedBlog.excerpt}</p>
                      <Link
                        to={`/blog/${relatedBlog.slug}`}
                        className="text-[#2C91D5] hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                      >
                        Read More <ChevronRight className="w-4 h-4" />
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Newsletter CTA */}
          <Card className="mt-16 bg-gradient-to-r from-[rgb(44,145,213)] to-[rgb(44,120,180)] text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">Stay in the Loop</h3>
              <p className="text-lg mb-6 opacity-90">
                Get the latest insights and stories from the startup world delivered to your inbox.
              </p>
              <div className="max-w-md mx-auto flex gap-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2 rounded-md text-gray-900"
                />
                <Button className="bg-white text-[#2C91D5] hover:bg-gray-100">
                  Subscribe
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BlogPost;