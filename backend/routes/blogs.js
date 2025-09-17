const express = require('express');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const slugify = require('slugify');

const router = express.Router();

// Validation middleware
const validateBlog = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('content')
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('excerpt')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Excerpt must be less than 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('meta_title')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Meta title must be less than 255 characters'),
  body('meta_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Meta description must be less than 500 characters'),
];

const validateSlug = [
  param('slug')
    .isLength({ min: 1 })
    .withMessage('Slug is required'),
];

// Helper function to generate slug
const generateSlug = (title) => {
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

// Helper function to calculate reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Get all published blogs (public endpoint)
router.get('/', async (req, res) => {
  try {
    
    const { page = 1, limit = 12, category, tag, search, featured } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE bp.status = 'published'";
    const params = [];

    // Add search filter
    if (search) {
      whereClause += " AND (bp.title LIKE ? OR bp.content LIKE ? OR bp.excerpt LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add featured filter
    if (featured === 'true') {
      whereClause += " AND bp.is_featured = 1";
    }

    // Add tag filter
    if (tag) {
      whereClause += " AND JSON_CONTAINS(bp.tags, ?)";
      params.push(`"${tag}"`);
    }

    // Main query
    const query = `
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.featured_image,
        bp.tags,
        bp.views,
        bp.is_featured,
        bp.publish_date,
        bp.created_at,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      JOIN users u ON bp.author_id = u.id
      ${whereClause}
      ORDER BY bp.is_featured DESC, bp.publish_date DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const blogs = await executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM blog_posts bp
      ${whereClause}
    `;
    const countParams = params; // No need to slice since limit/offset are not in params anymore
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get blogs error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blogs'
    });
  }
});

// Get single blog by slug (public endpoint)
router.get('/:slug', validateSlug, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { slug } = req.params;

    const query = `
      SELECT 
        bp.*,
        u.first_name as author_first_name,
        u.last_name as author_last_name,
        u.bio as author_bio
      FROM blog_posts bp
      JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = ? AND bp.status = 'published'
    `;

    const blog = await getOne(query, [slug]);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment view count
    await executeQuery(
      'UPDATE blog_posts SET views = views + 1 WHERE id = ?',
      [blog.id]
    );

    // Get related blogs
    const relatedQuery = `
      SELECT id, title, slug, excerpt, featured_image, publish_date
      FROM blog_posts
      WHERE status = 'published' AND id != ?
      ORDER BY RAND()
      LIMIT 3
    `;
    const relatedBlogs = await executeQuery(relatedQuery, [blog.id]);

    res.json({
      success: true,
      data: {
        blog: {
          ...blog,
          views: blog.views + 1
        },
        related: relatedBlogs
      }
    });

  } catch (error) {
    console.error('Get single blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blog'
    });
  }
});

// Admin routes - require authentication and admin role
// Get all blogs (including drafts) - Admin only
router.get('/admin/all', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status && status !== 'all') {
      whereClause += " AND bp.status = ?";
      params.push(status);
    }

    if (search) {
      whereClause += " AND (bp.title LIKE ? OR bp.content LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const query = `
      SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.status,
        bp.views,
        bp.is_featured,
        bp.publish_date,
        bp.created_at,
        bp.updated_at,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      JOIN users u ON bp.author_id = u.id
      ${whereClause}
      ORDER BY bp.updated_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(limitNum, offset);
    const blogs = await executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM blog_posts bp
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve blogs'
    });
  }
});

// Create new blog - Admin only
router.post('/', verifyToken, requireRole(['admin']), validateBlog, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const {
      title,
      content,
      excerpt,
      featured_image,
      tags,
      status = 'draft',
      is_featured = false,
      meta_title,
      meta_description
    } = req.body;

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let slugCounter = 1;
    let originalSlug = slug;
    while (await getOne('SELECT id FROM blog_posts WHERE slug = ?', [slug])) {
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(content);

    const query = `
      INSERT INTO blog_posts (
        title, slug, excerpt, content, featured_image, author_id,
        tags, status, is_featured, meta_title, meta_description,
        publish_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const publishDate = status === 'published' ? new Date() : null;

    const result = await executeQuery(query, [
      title,
      slug,
      excerpt,
      content,
      featured_image,
      req.user.id,
      JSON.stringify(tags || []),
      status,
      is_featured,
      meta_title || title,
      meta_description || excerpt,
      publishDate
    ]);

    // Get the created blog
    const createdBlog = await getOne(
      'SELECT * FROM blog_posts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: createdBlog
    });

  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog'
    });
  }
});

// Update blog - Admin only
router.put('/:id', verifyToken, requireRole(['admin']), validateBlog, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      featured_image,
      tags,
      status,
      is_featured,
      meta_title,
      meta_description
    } = req.body;

    // Check if blog exists
    const existingBlog = await getOne('SELECT * FROM blog_posts WHERE id = ?', [id]);
    if (!existingBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Generate new slug if title changed
    let slug = existingBlog.slug;
    if (title !== existingBlog.title) {
      slug = generateSlug(title);
      
      // Ensure slug is unique (excluding current blog)
      let slugCounter = 1;
      let originalSlug = slug;
      while (await getOne('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [slug, id])) {
        slug = `${originalSlug}-${slugCounter}`;
        slugCounter++;
      }
    }

    // Set publish date if changing from draft to published
    let publishDate = existingBlog.publish_date;
    if (status === 'published' && existingBlog.status === 'draft') {
      publishDate = new Date();
    }

    const query = `
      UPDATE blog_posts SET
        title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?,
        tags = ?, status = ?, is_featured = ?, meta_title = ?, meta_description = ?,
        publish_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [
      title,
      slug,
      excerpt,
      content,
      featured_image,
      JSON.stringify(tags || []),
      status,
      is_featured,
      meta_title || title,
      meta_description || excerpt,
      publishDate,
      id
    ]);

    // Get updated blog
    const updatedBlog = await getOne('SELECT * FROM blog_posts WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog
    });

  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog'
    });
  }
});

// Delete blog - Admin only
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await getOne('SELECT id FROM blog_posts WHERE id = ?', [id]);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    await executeQuery('DELETE FROM blog_posts WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });

  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog'
    });
  }
});

// Get blog categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await executeQuery(
      'SELECT * FROM blog_categories WHERE is_active = 1 ORDER BY name'
    );

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
});

module.exports = router;