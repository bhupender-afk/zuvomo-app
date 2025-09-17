const express = require('express');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { body, param, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateRating = [
  body('rating')
    .isFloat({ min: 1.0, max: 5.0 })
    .withMessage('Rating must be between 1.0 and 5.0'),
  body('review')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Review must not exceed 1000 characters'),
  body('is_anonymous')
    .optional()
    .isBoolean()
    .withMessage('is_anonymous must be a boolean'),
];

const validateProjectId = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a valid positive integer'),
];

// Get all ratings for a project
router.get('/project/:projectId', validateProjectId, async (req, res) => {
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
    const { page = 1, limit = 10, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

    // Get ratings with user info (respecting anonymity)
    const ratingsQuery = `
      SELECT 
        pr.id,
        pr.rating,
        pr.review,
        pr.is_anonymous,
        pr.created_at,
        pr.updated_at,
        CASE 
          WHEN pr.is_anonymous = TRUE THEN NULL
          ELSE JSON_OBJECT(
            'id', u.id,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'company', u.company
          )
        END as user_info
      FROM project_ratings pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.project_id = ?
      ORDER BY ${sort === 'rating_desc' ? 'pr.rating DESC' : 'pr.created_at DESC'}
      LIMIT ? OFFSET ?
    `;

    const ratings = await executeQuery(ratingsQuery, [projectId, parseInt(limit), offset]);

    // Get rating statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_ratings,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM project_ratings 
      WHERE project_id = ?
    `;

    const stats = await getOne(statsQuery, [projectId]);

    res.json({
      success: true,
      data: {
        ratings: ratings.map(rating => ({
          ...rating,
          user_info: rating.user_info ? JSON.parse(rating.user_info) : null
        })),
        stats: {
          ...stats,
          average_rating: parseFloat(stats.average_rating || 0).toFixed(1)
        },
        pagination: {
          current_page: parseInt(page),
          total_ratings: stats.total_ratings,
          has_next: ratings.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});

// Create or update a rating
router.post('/project/:projectId', verifyToken, validateProjectId, validateRating, async (req, res) => {
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
    const { rating, review, is_anonymous = false } = req.body;
    const userId = req.user.id;

    // Check if project exists
    const project = await getOne('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user already rated this project
    const existingRating = await getOne(
      'SELECT id FROM project_ratings WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    let query, params;
    if (existingRating) {
      // Update existing rating
      query = `
        UPDATE project_ratings 
        SET rating = ?, review = ?, is_anonymous = ?, updated_at = CURRENT_TIMESTAMP
        WHERE project_id = ? AND user_id = ?
      `;
      params = [rating, review, is_anonymous, projectId, userId];
    } else {
      // Create new rating
      query = `
        INSERT INTO project_ratings (project_id, user_id, rating, review, is_anonymous)
        VALUES (?, ?, ?, ?, ?)
      `;
      params = [projectId, userId, rating, review, is_anonymous];
    }

    await executeQuery(query, params);

    // Update project's cached rating statistics
    await updateProjectRatingCache(projectId);

    res.status(existingRating ? 200 : 201).json({
      success: true,
      message: existingRating ? 'Rating updated successfully' : 'Rating created successfully'
    });

  } catch (error) {
    console.error('Create/Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save rating'
    });
  }
});

// Delete a rating
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

    // Check if rating exists
    const rating = await getOne(
      'SELECT id FROM project_ratings WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Delete the rating
    await executeQuery(
      'DELETE FROM project_ratings WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    // Update project's cached rating statistics
    await updateProjectRatingCache(projectId);

    res.json({
      success: true,
      message: 'Rating deleted successfully'
    });

  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating'
    });
  }
});

// Get user's rating for a specific project
router.get('/project/:projectId/my-rating', verifyToken, validateProjectId, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const rating = await getOne(
      'SELECT rating, review, is_anonymous, created_at, updated_at FROM project_ratings WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    );

    res.json({
      success: true,
      data: rating
    });

  } catch (error) {
    console.error('Get my rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating'
    });
  }
});

// Helper function to update project rating cache
async function updateProjectRatingCache(projectId) {
  try {
    const stats = await getOne(
      'SELECT COUNT(*) as count, AVG(rating) as average FROM project_ratings WHERE project_id = ?',
      [projectId]
    );

    await executeQuery(
      'UPDATE projects SET average_rating = ?, rating_count = ? WHERE id = ?',
      [parseFloat(stats.average || 0).toFixed(1), stats.count, projectId]
    );
  } catch (error) {
    console.error('Error updating rating cache:', error);
  }
}

module.exports = router;