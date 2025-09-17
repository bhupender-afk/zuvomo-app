import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Calendar, User, ChevronRight, Tag, Filter, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  featured_image?: string;
  tags: string[];
  views: number;
  is_featured: boolean;
  publish_date: string;
  created_at: string;
  author_first_name: string;
  author_last_name: string;
  author_image?: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

const Blog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [featuredBlogs, setFeaturedBlogs] = useState<BlogPost[]>([]);

  // Fetch blogs
  const fetchBlogs = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTag && { tag: selectedTag }),
        ...(selectedCategory && { category: selectedCategory })
      });

      const response = await api.get(`/blogs?${params}`);
      
      if (response.data?.success) {
        setBlogs(response.data.data.blogs);
        setTotalPages(response.data.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch featured blogs
  const fetchFeaturedBlogs = async () => {
    try {
      const response = await api.get('/blogs?featured=true&limit=3');
      if (response.data?.success) {
        setFeaturedBlogs(response.data.data.blogs);
      }
    } catch (error) {
      console.error('Error fetching featured blogs:', error);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/blogs/categories');
      if (response.data?.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchFeaturedBlogs();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs(1);
  }, [searchTerm, selectedCategory, selectedTag]);

  // Handle search
  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedTag) params.set('tag', selectedTag);
    setSearchParams(params);
    fetchBlogs(1);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchBlogs(page);
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

  // Get reading time estimate
  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#2C91D5] to-blue-600 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-5xl font-bold mb-6">Zuvomo Blog</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Insights, stories, and expert advice from the world of startup funding and entrepreneurship
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 py-3 text-lg"
                />
              </div>
              <Button onClick={handleSearch} size="lg">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredBlogs.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredBlogs.map((blog) => (
                <Card key={blog.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {blog.featured_image && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={blog.featured_image}
                        alt={blog.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="bg-[#2C91D5] text-white">
                        Featured
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(blog.publish_date)}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="hover:text-[#2C91D5] transition-colors"
                      >
                        {blog.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{blog.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {blog.author_first_name} {blog.author_last_name}
                        </span>
                      </div>
                      <Link
                        to={`/blog/${blog.slug}`}
                        className="text-[#2C91D5] hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                      >
                        Read More <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
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
            
            {/* Filters and View Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <div className="flex flex-wrap gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border rounded-md px-3 py-2"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                
                {selectedTag && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Tag className="w-3 h-3 mr-1" />
                      {selectedTag}
                      <button
                        onClick={() => setSelectedTag('')}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Articles Grid/List */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2C91D5]"></div>
              </div>
            ) : blogs.length > 0 ? (
              <>
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "space-y-6"
                }>
                  {blogs.map((blog) => (
                    <Card key={blog.id} className={`overflow-hidden hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex flex-row' : ''
                    }`}>
                      {blog.featured_image && (
                        <div className={viewMode === 'list' 
                          ? "w-48 h-32 flex-shrink-0" 
                          : "h-48"
                        }>
                          <img
                            src={blog.featured_image}
                            alt={blog.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardContent className="p-6 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500">
                            {formatDate(blog.publish_date)}
                          </span>
                          {blog.is_featured && (
                            <Badge variant="secondary" className="bg-[#2C91D5] text-white">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold mb-3 line-clamp-2">
                          <Link
                            to={`/blog/${blog.slug}`}
                            className="hover:text-[#2C91D5] transition-colors"
                          >
                            {blog.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">{blog.excerpt}</p>
                        
                        {/* Tags */}
                        {blog.tags && blog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {blog.tags.slice(0, 3).map((tag, index) => (
                              <button
                                key={index}
                                onClick={() => setSelectedTag(tag)}
                                className="text-xs text-[#2C91D5] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {blog.author_first_name} {blog.author_last_name}
                            </span>
                          </div>
                          <Link
                            to={`/blog/${blog.slug}`}
                            className="text-[#2C91D5] hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                          >
                            Read More <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
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
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No articles found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="sticky top-8">
              
              {/* Categories */}
              <Card className="mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">Categories</h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                        !selectedCategory 
                          ? 'bg-[#2C91D5] text-white' 
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`block w-full text-left px-3 py-2 rounded transition-colors ${
                          selectedCategory === category.slug
                            ? 'bg-[#2C91D5] text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Stay Updated</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Get the latest insights and stories delivered to your inbox.
                  </p>
                  <div className="space-y-3">
                    <Input type="email" placeholder="Your email address" />
                    <Button className="w-full bg-[#2C91D5] hover:bg-blue-700">
                      Subscribe
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    We respect your privacy. Unsubscribe at any time.
                  </p>
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

export default Blog;