const express = require('express');
const bcrypt = require('bcrypt');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateUserRegistration, validateUserUpdate } = require('../middleware/validation');

const router = express.Router();

// Apply admin authentication to all routes
router.use(verifyToken);
router.use(requireRole(['admin']));

// Get all users with pagination and filtering
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // Ensure page and limit are numbers
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (role && role !== 'all') {
      whereClause += ' AND user_type = ?';
      params.push(role);
    }

    if (status && status !== 'all') {
      whereClause += ' AND approval_status = ?';
      params.push(status);
    }

    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const totalResult = await executeQuery(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );
    const total = totalResult[0].total;
    
    // Get users
    const users = await executeQuery(
      `SELECT id, email, first_name, last_name, user_type, company, location, 
              is_verified, is_active, approval_status, created_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ${limitNum} OFFSET ${offset}`
    );

    res.json({
      users,
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user (investor or project owner)
router.post('/users', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, first_name, last_name, user_type, company, location } = req.body;

    // Check if user already exists
    const existingUser = await getOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5);

    // Insert new user (admin-created users are automatically approved)
    await executeQuery(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, user_type, 
        company, location, is_verified, is_active, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, password_hash, first_name, last_name, user_type, company || null, location || null, true, true, 'approved']
    );

    // Get created user
    const user = await getOne(
      'SELECT id, email, first_name, last_name, user_type, company, location, is_verified, approval_status FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.user_type,
        company: user.company,
        location: user.location,
        is_verified: user.is_verified,
        approval_status: user.approval_status
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', validateUserUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, company, location, is_active, approval_status } = req.body;

    // Check if user exists
    const existingUser = await getOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      params.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      params.push(last_name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      params.push(email);
    }
    if (company !== undefined) {
      updates.push('company = ?');
      params.push(company);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (approval_status !== undefined) {
      updates.push('approval_status = ?');
      params.push(approval_status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);

    await executeQuery(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Get updated user
    const updatedUser = await getOne(
      'SELECT id, email, first_name, last_name, user_type, company, location, is_verified, is_active, approval_status FROM users WHERE id = ?',
      [id]
    );

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.user_type,
        company: updatedUser.company,
        location: updatedUser.location,
        is_verified: updatedUser.is_verified,
        is_active: updatedUser.is_active,
        approval_status: updatedUser.approval_status
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await getOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of admin users
    const user = await getOne('SELECT user_type FROM users WHERE id = ?', [id]);
    if (user.user_type === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    await executeQuery('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get all projects for approval
router.get('/projects', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search, sort = 'created_at' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND p.project_status = ?';
      params.push(status);
    }

    if (category) {
      whereClause += ' AND p.industry = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Validate sort parameter
    const validSorts = ['created_at', 'title', 'project_status', 'funding_goal'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';

    // Get total count
    const totalResult = await executeQuery(
      `SELECT COUNT(*) as total FROM projects p 
       JOIN users u ON p.owner_id = u.id
       ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    // Get projects with owner info and calculated fields
    const projects = await executeQuery(
      `SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email,
        u.company,
        p.industry as category,
        p.project_status as status,
        DATEDIFF(NOW(), p.created_at) as days_since_submission,
        (p.current_funding + IFNULL(p.funding_from_other_sources, 0)) as total_current_funding,
        ROUND(((p.current_funding + IFNULL(p.funding_from_other_sources, 0)) / p.funding_goal * 100), 2) as progress_percentage
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       ${whereClause}
       ORDER BY p.${sortField} DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    res.json({
      projects: projects.map(project => ({
        ...project,
        // Ensure compatibility with frontend expectations
        short_description: project.description?.substring(0, 150) + '...' || '',
        minimum_investment: 1000, // Default value, can be added to schema later
        equity_percentage: 10, // Default value, can be added to schema later
        average_rating: project.rating || 5.0,
        rating_count: project.total_ratings || 0,
        is_featured: Boolean(project.is_featured),
        image_url: project.logo_url
      })),
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Approve project
router.put('/projects/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const project = await getOne('SELECT id, project_status FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await executeQuery(
      'UPDATE projects SET project_status = ?, rejection_reason = ? WHERE id = ?',
      ['approved', admin_notes || null, id]
    );

    res.json({ message: 'Project approved successfully' });

  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({ error: 'Failed to approve project' });
  }
});

// Reject project
router.put('/projects/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const project = await getOne('SELECT id, project_status FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await executeQuery(
      'UPDATE projects SET project_status = ?, rejection_reason = ? WHERE id = ?',
      ['rejected', admin_notes || 'Project rejected by admin', id]
    );

    res.json({ message: 'Project rejected successfully' });

  } catch (error) {
    console.error('Reject project error:', error);
    res.status(500).json({ error: 'Failed to reject project' });
  }
});

// Get dashboard analytics
router.get('/analytics', async (req, res) => {
  try {
    // Get user counts by type
    const userCounts = await executeQuery(`
      SELECT 
        user_type,
        COUNT(*) as count,
        SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM users 
      WHERE user_type != 'admin'
      GROUP BY user_type
    `);

    // Get project counts by status
    const projectCounts = await executeQuery(`
      SELECT 
        project_status as status,
        COUNT(*) as count
      FROM projects 
      GROUP BY project_status
    `);

    // Get recent activity (last 30 days)
    const recentActivity = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    res.json({
      user_counts: userCounts,
      project_counts: projectCounts,
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Add stats endpoint (alias for analytics)
router.get('/stats', async (req, res) => {
  try {
    // Get project counts
    const projectCounts = await executeQuery(`
      SELECT 
        project_status as status,
        COUNT(*) as count
      FROM projects 
      GROUP BY project_status
    `);

    // Transform to expected format
    const statusCounts = {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      submitted: 0
    };

    projectCounts.forEach(row => {
      statusCounts.total += row.count;
      if (row.status === 'approved') statusCounts.approved = row.count;
      else if (row.status === 'submitted') statusCounts.pending = row.count;
      else if (row.status === 'rejected') statusCounts.rejected = row.count;
    });

    // Get user counts
    const userCounts = await executeQuery(`
      SELECT 
        user_type,
        COUNT(*) as count
      FROM users 
      WHERE user_type != 'admin'
      GROUP BY user_type
    `);

    const userStats = {
      total: 0,
      project_owners: 0,
      investors: 0,
      admins: 1
    };

    userCounts.forEach(row => {
      userStats.total += row.count;
      if (row.user_type === 'project_owner') userStats.project_owners = row.count;
      else if (row.user_type === 'investor') userStats.investors = row.count;
    });

    // Calculate comprehensive funding statistics
    const fundingResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(funding_goal) as total_funding_goal,
        SUM(current_funding + IFNULL(funding_from_other_sources, 0)) as total_current_funding,
        AVG((current_funding + IFNULL(funding_from_other_sources, 0)) / funding_goal * 100) as avg_progress
      FROM projects 
      WHERE project_status = 'approved' AND funding_goal > 0
    `);

    const fundingStats = {
      total_projects: fundingResult[0]?.total_projects || 0,
      total_funding_goal: parseFloat(fundingResult[0]?.total_funding_goal || 0),
      total_current_funding: parseFloat(fundingResult[0]?.total_current_funding || 0),
      avg_progress: parseFloat(fundingResult[0]?.avg_progress || 0).toFixed(1)
    };

    // Get recent activity for dashboard
    const recentActivity = await executeQuery(`
      SELECT 
        p.id,
        p.title,
        p.project_status as status,
        p.created_at,
        u.first_name,
        u.last_name,
        u.company,
        CONCAT(u.first_name, ' ', u.last_name) as owner_name
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);

    // Get category breakdown
    const categoryBreakdown = await executeQuery(`
      SELECT 
        industry as category,
        COUNT(*) as count,
        SUM(current_funding + IFNULL(funding_from_other_sources, 0)) as total_funding
      FROM projects 
      WHERE project_status = 'approved'
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      project_counts: statusCounts,
      user_counts: userStats,
      funding_stats: fundingStats,
      recent_activity: recentActivity,
      category_breakdown: categoryBreakdown
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Toggle featured status for approved projects
router.put('/projects/:id/featured', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    // Check if project exists and is approved
    const project = await getOne(
      'SELECT id, project_status, is_featured FROM projects WHERE id = ?',
      [id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.project_status !== 'approved') {
      return res.status(400).json({ error: 'Only approved projects can be featured' });
    }

    // Update featured status
    await executeQuery(
      'UPDATE projects SET is_featured = ? WHERE id = ?',
      [is_featured ? 1 : 0, id]
    );

    res.json({ 
      message: `Project ${is_featured ? 'featured' : 'unfeatured'} successfully`,
      is_featured: is_featured
    });

  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

module.exports = router;