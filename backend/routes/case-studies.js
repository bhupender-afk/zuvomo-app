const express = require('express');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const slugify = require('slugify');

const router = express.Router();

// Validation middleware
const validateCaseStudy = [
  body('title')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('company_name')
    .isLength({ min: 1, max: 200 })
    .withMessage('Company name is required and must be less than 200 characters'),
  body('challenge')
    .isLength({ min: 1 })
    .withMessage('Challenge description is required'),
  body('solution')
    .isLength({ min: 1 })
    .withMessage('Solution description is required'),
  body('results')
    .isLength({ min: 1 })
    .withMessage('Results description is required'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  body('industry')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Industry must be less than 100 characters'),
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

// Get all published case studies (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, industry, tag, search, featured } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE cs.status = 'published'";
    const params = [];

    // Add search filter
    if (search) {
      whereClause += " AND (cs.title LIKE ? OR cs.company_name LIKE ? OR cs.industry LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Add featured filter
    if (featured === 'true') {
      whereClause += " AND cs.is_featured = 1";
    }

    // Add industry filter
    if (industry) {
      whereClause += " AND cs.industry = ?";
      params.push(industry);
    }

    // Add tag filter
    if (tag) {
      whereClause += " AND JSON_CONTAINS(cs.tags, ?)";
      params.push(`"${tag}"`);
    }

    // Main query
    const query = `
      SELECT 
        cs.id,
        cs.title,
        cs.slug,
        cs.company_name,
        cs.industry,
        cs.company_size,
        cs.featured_image,
        cs.company_logo,
        cs.challenge,
        cs.solution,
        cs.results,
        cs.metrics,
        cs.tags,
        cs.views,
        cs.is_featured,
        cs.completion_date,
        cs.project_duration,
        cs.created_at
      FROM case_studies cs
      ${whereClause}
      ORDER BY cs.is_featured DESC, cs.created_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const caseStudies = await executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM case_studies cs
      ${whereClause}
    `;
    const countParams = params; // No need to slice since limit/offset are not in params anymore
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        case_studies: caseStudies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get case studies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case studies'
    });
  }
});

// Get single case study by slug (public endpoint)
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
      SELECT *
      FROM case_studies
      WHERE slug = ? AND status = 'published'
    `;

    const caseStudy = await getOne(query, [slug]);

    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found'
      });
    }

    // Increment view count
    await executeQuery(
      'UPDATE case_studies SET views = views + 1 WHERE id = ?',
      [caseStudy.id]
    );

    // Get related case studies
    const relatedQuery = `
      SELECT id, title, slug, company_name, industry, featured_image, company_logo
      FROM case_studies
      WHERE status = 'published' AND id != ?
      ${caseStudy.industry ? 'AND industry = ?' : ''}
      ORDER BY RAND()
      LIMIT 3
    `;
    
    const relatedParams = [caseStudy.id];
    if (caseStudy.industry) {
      relatedParams.push(caseStudy.industry);
    }
    
    const relatedCaseStudies = await executeQuery(relatedQuery, relatedParams);

    res.json({
      success: true,
      data: {
        case_study: {
          ...caseStudy,
          views: caseStudy.views + 1
        },
        related: relatedCaseStudies
      }
    });

  } catch (error) {
    console.error('Get single case study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case study'
    });
  }
});

// Get industries for filtering
router.get('/filters/industries', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT industry, COUNT(*) as count
      FROM case_studies
      WHERE status = 'published' AND industry IS NOT NULL
      GROUP BY industry
      ORDER BY count DESC, industry
    `;

    const industries = await executeQuery(query);

    res.json({
      success: true,
      data: industries
    });

  } catch (error) {
    console.error('Get case study industries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve industries'
    });
  }
});

// Admin routes - require authentication and admin role
// Get all case studies (including drafts) - Admin only
router.get('/admin/all', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, industry, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (status && status !== 'all') {
      whereClause += " AND cs.status = ?";
      params.push(status);
    }

    if (industry && industry !== 'all') {
      whereClause += " AND cs.industry = ?";
      params.push(industry);
    }

    if (search) {
      whereClause += " AND (cs.title LIKE ? OR cs.company_name LIKE ? OR cs.industry LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const query = `
      SELECT 
        cs.id,
        cs.title,
        cs.slug,
        cs.company_name,
        cs.industry,
        cs.status,
        cs.views,
        cs.is_featured,
        cs.completion_date,
        cs.created_at,
        cs.updated_at
      FROM case_studies cs
      ${whereClause}
      ORDER BY cs.updated_at DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    const caseStudies = await executeQuery(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM case_studies cs
      ${whereClause}
    `;
    const countParams = params.slice(0, -2);
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        case_studies: caseStudies,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Get admin case studies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve case studies'
    });
  }
});

// Create new case study - Admin only
router.post('/', verifyToken, requireRole(['admin']), validateCaseStudy, async (req, res) => {
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
      company_name,
      industry,
      company_size,
      challenge,
      solution,
      results,
      content,
      featured_image,
      company_logo,
      testimonial,
      testimonial_author,
      testimonial_position,
      metrics,
      tags,
      status = 'draft',
      is_featured = false,
      completion_date,
      project_duration
    } = req.body;

    // Generate slug from title
    let slug = generateSlug(title);
    
    // Ensure slug is unique
    let slugCounter = 1;
    let originalSlug = slug;
    while (await getOne('SELECT id FROM case_studies WHERE slug = ?', [slug])) {
      slug = `${originalSlug}-${slugCounter}`;
      slugCounter++;
    }

    const query = `
      INSERT INTO case_studies (
        title, slug, company_name, industry, company_size, challenge,
        solution, results, content, featured_image, company_logo,
        testimonial, testimonial_author, testimonial_position, metrics,
        tags, status, is_featured, completion_date, project_duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      title,
      slug,
      company_name,
      industry,
      company_size,
      challenge,
      solution,
      results,
      content,
      featured_image,
      company_logo,
      testimonial,
      testimonial_author,
      testimonial_position,
      JSON.stringify(metrics || {}),
      JSON.stringify(tags || []),
      status,
      is_featured,
      completion_date,
      project_duration
    ]);

    // Get the created case study
    const createdCaseStudy = await getOne(
      'SELECT * FROM case_studies WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Case study created successfully',
      data: createdCaseStudy
    });

  } catch (error) {
    console.error('Create case study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create case study'
    });
  }
});

// Update case study - Admin only
router.put('/:id', verifyToken, requireRole(['admin']), validateCaseStudy, async (req, res) => {
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
      company_name,
      industry,
      company_size,
      challenge,
      solution,
      results,
      content,
      featured_image,
      company_logo,
      testimonial,
      testimonial_author,
      testimonial_position,
      metrics,
      tags,
      status,
      is_featured,
      completion_date,
      project_duration
    } = req.body;

    // Check if case study exists
    const existingCaseStudy = await getOne('SELECT * FROM case_studies WHERE id = ?', [id]);
    if (!existingCaseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found'
      });
    }

    // Generate new slug if title changed
    let slug = existingCaseStudy.slug;
    if (title !== existingCaseStudy.title) {
      slug = generateSlug(title);
      
      // Ensure slug is unique (excluding current case study)
      let slugCounter = 1;
      let originalSlug = slug;
      while (await getOne('SELECT id FROM case_studies WHERE slug = ? AND id != ?', [slug, id])) {
        slug = `${originalSlug}-${slugCounter}`;
        slugCounter++;
      }
    }

    const query = `
      UPDATE case_studies SET
        title = ?, slug = ?, company_name = ?, industry = ?, company_size = ?,
        challenge = ?, solution = ?, results = ?, content = ?, featured_image = ?,
        company_logo = ?, testimonial = ?, testimonial_author = ?, testimonial_position = ?,
        metrics = ?, tags = ?, status = ?, is_featured = ?, completion_date = ?,
        project_duration = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [
      title,
      slug,
      company_name,
      industry,
      company_size,
      challenge,
      solution,
      results,
      content,
      featured_image,
      company_logo,
      testimonial,
      testimonial_author,
      testimonial_position,
      JSON.stringify(metrics || {}),
      JSON.stringify(tags || []),
      status,
      is_featured,
      completion_date,
      project_duration,
      id
    ]);

    // Get updated case study
    const updatedCaseStudy = await getOne('SELECT * FROM case_studies WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Case study updated successfully',
      data: updatedCaseStudy
    });

  } catch (error) {
    console.error('Update case study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update case study'
    });
  }
});

// Delete case study - Admin only
router.delete('/:id', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const caseStudy = await getOne('SELECT id FROM case_studies WHERE id = ?', [id]);
    if (!caseStudy) {
      return res.status(404).json({
        success: false,
        message: 'Case study not found'
      });
    }

    await executeQuery('DELETE FROM case_studies WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Case study deleted successfully'
    });

  } catch (error) {
    console.error('Delete case study error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete case study'
    });
  }
});

module.exports = router;