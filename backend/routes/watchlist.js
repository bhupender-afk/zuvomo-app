const express = require('express');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateProjectId = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a valid positive integer'),
];

const validateNotes = [
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
];

// Get user's watchlist
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 12, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    const sortOptions = {
      'created_at': 'w.created_at DESC',
      'project_name': 'p.title ASC',
      'funding': 'p.current_funding DESC',
      'rating': 'p.average_rating DESC'
    };

    const sortQuery = sortOptions[sort] || sortOptions['created_at'];

    // Get watchlist items with project details
    const watchlistQuery = `
      SELECT 
        w.id as watchlist_id,
        w.notes,
        w.created_at as added_to_watchlist,
        p.id as project_id,
        p.title,
        p.short_description,
        p.category,
        p.funding_goal,
        p.current_funding,
        p.minimum_investment,
        p.equity_percentage,
        p.location,
        p.stage as project_stage,
        p.status,
        p.logo_url,
        p.average_rating,
        p.rating_count,
        p.progress_percentage,
        p.is_featured,
        p.valuation,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.company as owner_company
      FROM watchlist w
      JOIN projects p ON w.project_id = p.id
      JOIN users u ON p.owner_id = u.id
      WHERE w.user_id = ? AND p.status = 'approved'
      ORDER BY ${sortQuery}
      LIMIT ? OFFSET ?
    `;

    const watchlistItems = await executeQuery(watchlistQuery, [userId, parseInt(limit), offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM watchlist w
      JOIN projects p ON w.project_id = p.id
      WHERE w.user_id = ? AND p.status = 'approved'
    `;

    const countResult = await getOne(countQuery, [userId]);
    const totalItems = countResult.total;

    // Get project tags for each project
    const projectIds = watchlistItems.map(item => item.project_id);
    let projectTags = [];

    if (projectIds.length > 0) {
      const tagsQuery = `
        SELECT ptr.project_id, pt.name, pt.color
        FROM project_tag_relationships ptr
        JOIN project_tags pt ON ptr.tag_id = pt.id
        WHERE ptr.project_id IN (${projectIds.map(() => '?').join(',')})
      `;
      
      projectTags = await executeQuery(tagsQuery, projectIds);
    }

    // Group tags by project
    const tagsByProject = projectTags.reduce((acc, tag) => {
      if (!acc[tag.project_id]) {
        acc[tag.project_id] = [];
      }
      acc[tag.project_id].push({
        name: tag.name,
        color: tag.color
      });
      return acc;
    }, {});

    // Add tags to each project
    const enrichedWatchlist = watchlistItems.map(item => ({
      ...item,
      tags: tagsByProject[item.project_id] || [],
      owner: {
        first_name: item.owner_first_name,
        last_name: item.owner_last_name,
        company: item.owner_company
      },
      // Remove individual owner fields
      owner_first_name: undefined,
      owner_last_name: undefined,
      owner_company: undefined
    }));

    res.json({
      success: true,
      data: {
        watchlist: enrichedWatchlist,
        pagination: {
          current_page: parseInt(page),
          total_items: totalItems,
          items_per_page: parseInt(limit),
          total_pages: Math.ceil(totalItems / limit),
          has_next: offset + watchlistItems.length < totalItems,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watchlist'
    });
  }
});

// Add project to watchlist
router.post('/project/:projectId', verifyToken, validateProjectId, validateNotes, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const { notes = '' } = req.body;
    const userId = req.user.id;

    // Check if project exists and is approved
    const project = await getOne(
      'SELECT id, title FROM projects WHERE id = ? AND status = "approved"',
      [projectId]
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or not approved'
      });
    }

    // Check if already in watchlist
    const existingWatchlistItem = await getOne(
      'SELECT id FROM watchlist WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    );

    if (existingWatchlistItem) {
      return res.status(409).json({
        success: false,
        message: 'Project is already in your watchlist'
      });
    }

    // Add to watchlist
    await executeQuery(
      'INSERT INTO watchlist (user_id, project_id, notes) VALUES (?, ?, ?)',
      [userId, projectId, notes]
    );

    res.status(201).json({
      success: true,
      message: `${project.title} added to watchlist successfully`
    });

  } catch (error) {
    console.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add project to watchlist'
    });
  }
});

// Remove project from watchlist
router.delete('/project/:projectId', verifyToken, validateProjectId, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if item exists in watchlist
    const watchlistItem = await getOne(
      'SELECT w.id, p.title FROM watchlist w JOIN projects p ON w.project_id = p.id WHERE w.user_id = ? AND w.project_id = ?',
      [userId, projectId]
    );

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in your watchlist'
      });
    }

    // Remove from watchlist
    await executeQuery(
      'DELETE FROM watchlist WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    );

    res.json({
      success: true,
      message: `${watchlistItem.title} removed from watchlist successfully`
    });

  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove project from watchlist'
    });
  }
});

// Update watchlist item notes
router.put('/project/:projectId', verifyToken, validateProjectId, validateNotes, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const { notes = '' } = req.body;
    const userId = req.user.id;

    // Check if item exists in watchlist
    const watchlistItem = await getOne(
      'SELECT id FROM watchlist WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    );

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Project not found in your watchlist'
      });
    }

    // Update notes
    await executeQuery(
      'UPDATE watchlist SET notes = ? WHERE user_id = ? AND project_id = ?',
      [notes, userId, projectId]
    );

    res.json({
      success: true,
      message: 'Watchlist notes updated successfully'
    });

  } catch (error) {
    console.error('Update watchlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update watchlist notes'
    });
  }
});

// Check if project is in user's watchlist
router.get('/project/:projectId/status', verifyToken, validateProjectId, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { projectId } = req.params;
    const userId = req.user.id;

    const watchlistItem = await getOne(
      'SELECT notes, created_at FROM watchlist WHERE user_id = ? AND project_id = ?',
      [userId, projectId]
    );

    res.json({
      success: true,
      data: {
        in_watchlist: !!watchlistItem,
        notes: watchlistItem?.notes || null,
        added_at: watchlistItem?.created_at || null
      }
    });

  } catch (error) {
    console.error('Check watchlist status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check watchlist status'
    });
  }
});

// Get watchlist statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(CASE WHEN p.status = 'approved' THEN 1 END) as approved_projects,
        COUNT(CASE WHEN p.is_featured = TRUE THEN 1 END) as featured_projects,
        AVG(p.average_rating) as avg_watchlist_rating
      FROM watchlist w
      JOIN projects p ON w.project_id = p.id
      WHERE w.user_id = ?
    `;

    const stats = await getOne(statsQuery, [userId]);

    // Get category breakdown
    const categoryQuery = `
      SELECT p.category, COUNT(*) as count
      FROM watchlist w
      JOIN projects p ON w.project_id = p.id
      WHERE w.user_id = ? AND p.status = 'approved'
      GROUP BY p.category
      ORDER BY count DESC
    `;

    const categories = await executeQuery(categoryQuery, [userId]);

    res.json({
      success: true,
      data: {
        ...stats,
        avg_watchlist_rating: parseFloat(stats.avg_watchlist_rating || 0).toFixed(1),
        category_breakdown: categories
      }
    });

  } catch (error) {
    console.error('Get watchlist stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch watchlist statistics'
    });
  }
});

module.exports = router;