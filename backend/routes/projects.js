const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken, requireRole, optionalAuth } = require('../middleware/auth');
const { validateProjectCreation, validateProjectUpdate } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = '/var/www/uploads/projects';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const projectId = req.params.id || req.body.projectId || 'temp';
    const ext = path.extname(file.originalname);
    cb(null, `${projectId}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

// Configure upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files per upload
  }
});

// Get all approved projects (public route)
router.get('/approved', optionalAuth, async (req, res) => {
  try {
    console.log('API Request approved:',req.query );
    const { page = 1, limit = 12, category, search, sort = 'created_at' } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;
    
    console.log('API Request params:', { page, limit, pageNum, limitNum, offset });

    let whereClause = 'WHERE p.project_status = "approved"';
    const params = [];

    if (category) {
      whereClause += ' AND p.industry = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.industry LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Determine sort order
    let orderBy = 'ORDER BY p.created_at DESC';
    switch (sort) {
      case 'funding_goal':
        orderBy = 'ORDER BY p.funding_goal DESC';
        break;
      case 'current_funding':
        orderBy = 'ORDER BY p.current_funding DESC';
        break;
      case 'rating':
        orderBy = 'ORDER BY p.rating DESC';
        break;
      case 'title':
        orderBy = 'ORDER BY p.title ASC';
        break;
      default:
        orderBy = 'ORDER BY p.created_at DESC';
    }

    // Get total count
    const totalResult = await executeQuery(
      `SELECT COUNT(*) as total FROM projects p ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    // Get projects with owner info    
    const projects = await executeQuery(
      `SELECT p.id, p.title, p.description, p.industry, p.stage, p.funding_goal, 
              p.current_funding, p.funding_from_other_sources, p.location, p.team_size, p.created_at,
              p.logo_url as image_url, p.tags, p.rating, p.valuation,
              u.first_name, u.last_name, u.company
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       ${whereClause}
       ${orderBy}
       LIMIT ${limitNum} OFFSET ${offset}`,
      params
    );

    // Calculate funding percentage and format data for frontend
    const projectsWithStats = projects.map(project => ({
      ...project,
      funding_percentage: Math.round((project.current_funding / project.funding_goal) * 100),
      progress: Math.round((project.current_funding / project.funding_goal) * 100),
      owner_name: `${project.first_name} ${project.last_name}`,
      category: project.industry,
      image: project.image_url,
      image_url: project.image_url, // Add alias for compatibility
      fundRaised: `$${(project.current_funding / 1000000).toFixed(2)}M`,
      tagsArray: project.tags ? (project.tags.startsWith('[') ? JSON.parse(project.tags) : project.tags.split(',').map(tag => tag.trim())) : []
    }));

    res.json({
      projects: projectsWithStats,
      pagination: {
        current_page: pageNum,
        per_page: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Get approved projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const project = await getOne(
      `SELECT p.*, u.first_name, u.last_name, u.company, u.email
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Only show approved projects to non-owners (unless user is admin or project owner)
    if (project.project_status !== 'approved' && 
        (!req.user || 
         (req.user.id !== project.owner_id && req.user.role !== 'admin'))) {
      return res.status(403).json({ error: 'Project not accessible' });
    }

    // Get project updates if user is logged in
    let updates = [];
    if (req.user) {
      updates = await executeQuery(
        'SELECT id, title, content, update_type, created_at FROM project_updates WHERE project_id = ? AND is_public = 1 ORDER BY created_at DESC LIMIT 5',
        [id]
      );
    }

    res.json({
      ...project,
      funding_percentage: Math.round((project.current_funding / project.funding_goal) * 100),
      owner_name: `${project.first_name} ${project.last_name}`,
      updates
    });

  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project (project owners only)
router.post('/', verifyToken, requireRole(['project_owner']), validateProjectCreation, async (req, res) => {
  try {
    const {
      title, description, industry, funding_goal, funding_from_other_sources,
      equity_percentage, location, team_size, stage, valuation, tags
    } = req.body;

    // Generate project ID (max 20 chars for database)
    const projectId = 'PRJ' + Date.now().toString().slice(-10) + Math.random().toString(36).substr(2, 4);
    
    const insertValues = [
      projectId, title, description || '', industry, stage || 'idea', funding_goal, 
      0, funding_from_other_sources || 0, valuation || null, team_size?.toString(), location, 
      tags || null, req.user.id, 'draft'
    ];

    await executeQuery(
      `INSERT INTO projects (
        id, title, description, industry, stage, funding_goal, current_funding, funding_from_other_sources,
        valuation, team_size, location, tags, owner_id, project_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );

    const project = await getOne(
      'SELECT * FROM projects WHERE id = ?',
      [projectId]
    );

    res.status(201).json({
      message: 'Project created successfully as draft',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      requestBody: req.body
    });
    
    // Provide more specific error messages
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'A project with this information already exists' });
    } else if (error.code?.startsWith('ER_')) {
      res.status(400).json({ error: 'Database validation error. Please check your input.' });
    } else {
      res.status(500).json({ error: `Failed to create project: ${error.message}` });
    }
  }
});

// Get user's projects (project owners only)
router.get('/my/projects', verifyToken, requireRole(['project_owner']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE owner_id = ?';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND project_status = ?';
      params.push(status);
    }

    // Get total count
    const totalResult = await executeQuery(
      `SELECT COUNT(*) as total FROM projects ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    // Get projects with pagination
    const limitNum = Number(limit);
    const offsetNum = Number(offset);
    const projects = await executeQuery(
      `SELECT * FROM projects ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    // Add funding percentage and investment count
    const projectsWithStats = projects.map(project => ({
      ...project,
      funding_percentage: Math.round((project.current_funding / project.funding_goal) * 100),
      progress_percentage: Math.round((project.current_funding / project.funding_goal) * 100),
      project_stage: project.stage, // Add frontend compatibility
      stage: project.stage,
      status: project.project_status,
      // Add image_url alias for frontend compatibility
      image_url: project.image_url,
      image: project.image_url,
      tags: project.tags ? project.tags.split(',').map(tag => tag.trim()) : []
    }));

    res.json({
      projects: projectsWithStats,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get my projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});


// Submit project for review
router.put('/:id/submit', verifyToken, requireRole(['project_owner']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists and belongs to user
    const project = await getOne(
      'SELECT id, owner_id, project_status FROM projects WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Allow submission for draft and rejected projects
    if (project.project_status !== 'draft' && project.project_status !== 'rejected') {
      return res.status(403).json({ error: 'Only draft or rejected projects can be submitted for review' });
    }

    await executeQuery(
      'UPDATE projects SET project_status = ?, submitted_at = NOW(), rejection_reason = NULL WHERE id = ?',
      ['submitted', id]
    );

    res.json({ message: 'Project submitted for review successfully' });

  } catch (error) {
    console.error('Submit project error:', error);
    res.status(500).json({ error: 'Failed to submit project' });
  }
});

// Get project categories (public)
router.get('/data/categories', async (req, res) => {
  try {
    const categories = await executeQuery(
      'SELECT DISTINCT industry as category FROM projects WHERE project_status = "approved" ORDER BY industry'
    );

    res.json({
      categories: categories.map(row => row.category)
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get filter options for frontend (public)
router.get('/data/filters', async (req, res) => {
  try {
    // Get all unique categories
    const categories = await executeQuery(
      'SELECT DISTINCT industry as category FROM projects WHERE project_status = "approved" ORDER BY industry'
    );

    // Get all unique project stages
    const stages = await executeQuery(
      'SELECT DISTINCT stage FROM projects WHERE project_status = "approved" ORDER BY stage'
    );

    // Get all unique locations (top 20 most common)
    const locations = await executeQuery(
      `SELECT location, COUNT(*) as count 
       FROM projects 
       WHERE status = "approved" 
       GROUP BY location 
       ORDER BY count DESC, location ASC 
       LIMIT 20`
    );

    // Get funding ranges (calculated ranges)
    const fundingRanges = [
      { label: 'Under $10K', min: 0, max: 10000 },
      { label: '$10K - $50K', min: 10000, max: 50000 },
      { label: '$50K - $100K', min: 50000, max: 100000 },
      { label: '$100K - $500K', min: 100000, max: 500000 },
      { label: '$500K - $1M', min: 500000, max: 1000000 },
      { label: 'Over $1M', min: 1000000, max: null }
    ];

    // Get equity ranges
    const equityRanges = [
      { label: 'Under 5%', min: 0, max: 5 },
      { label: '5% - 10%', min: 5, max: 10 },
      { label: '10% - 20%', min: 10, max: 20 },
      { label: '20% - 30%', min: 20, max: 30 },
      { label: 'Over 30%', min: 30, max: null }
    ];

    // Get available project tags
    const tags = await executeQuery(
      `SELECT pt.id, pt.name, pt.color, COUNT(ptr.project_id) as project_count
       FROM project_tags pt
       LEFT JOIN project_tag_relationships ptr ON pt.id = ptr.tag_id
       LEFT JOIN projects p ON ptr.project_id = p.id AND p.status = 'approved'
       WHERE pt.is_active = TRUE
       GROUP BY pt.id, pt.name, pt.color
       ORDER BY project_count DESC, pt.name ASC`
    );

    res.json({
      success: true,
      data: {
        categories: categories.map(row => row.category),
        stages: stages.map(row => row.stage),
        locations: locations.map(row => ({
          name: row.location,
          count: row.count
        })),
        funding_ranges: fundingRanges,
        equity_ranges: equityRanges,
        tags: tags
      }
    });

  } catch (error) {
    console.error('Get filter options error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch filter options' 
    });
  }
});

// Advanced project search with filters (public)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      category, 
      stage, 
      location, 
      funding_min, 
      funding_max, 
      equity_min, 
      equity_max,
      tags,
      sort = 'created_at',
      featured_only,
      min_rating
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE p.status = "approved"';
    const params = [];

    // Search in title, description, and short_description
    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.short_description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Category filter
    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    // Project stage filter
    if (stage) {
      whereClause += ' AND p.stage = ?';
      params.push(stage);
    }

    // Location filter
    if (location) {
      whereClause += ' AND p.location LIKE ?';
      params.push(`%${location}%`);
    }

    // Funding range filters
    if (funding_min) {
      whereClause += ' AND p.funding_goal >= ?';
      params.push(parseFloat(funding_min));
    }
    if (funding_max) {
      whereClause += ' AND p.funding_goal <= ?';
      params.push(parseFloat(funding_max));
    }

    // Equity range filters
    if (equity_min) {
      whereClause += ' AND p.equity_percentage >= ?';
      params.push(parseFloat(equity_min));
    }
    if (equity_max) {
      whereClause += ' AND p.equity_percentage <= ?';
      params.push(parseFloat(equity_max));
    }

    // Featured projects only
    if (featured_only === 'true') {
      whereClause += ' AND p.is_featured = TRUE';
    }

    // Minimum rating filter
    if (min_rating) {
      whereClause += ' AND p.average_rating >= ?';
      params.push(parseFloat(min_rating));
    }

    // Tags filter (if provided)
    let tagJoin = '';
    if (tags) {
      const tagIds = tags.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (tagIds.length > 0) {
        tagJoin = `JOIN project_tag_relationships ptr ON p.id = ptr.project_id 
                   JOIN project_tags pt ON ptr.tag_id = pt.id`;
        whereClause += ` AND pt.id IN (${tagIds.map(() => '?').join(',')})`;
        params.push(...tagIds);
      }
    }

    // Sort options
    const sortOptions = {
      'created_at': 'p.created_at DESC',
      'title': 'p.title ASC',
      'funding_goal': 'p.funding_goal DESC',
      'current_funding': 'p.current_funding DESC',
      'progress': 'p.progress_percentage DESC',
      'rating': 'p.average_rating DESC',
      'location': 'p.location ASC'
    };

    const orderBy = sortOptions[sort] || sortOptions['created_at'];

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ${tagJoin}
      ${whereClause}
    `;

    const totalResult = await executeQuery(countQuery, params);
    const total = totalResult[0].total;

    // Get projects with owner info
    const projectsQuery = `
      SELECT DISTINCT
        p.id, p.title, p.short_description, p.category, p.subcategory,
        p.funding_goal, p.current_funding, p.minimum_investment, p.equity_percentage,
        p.location, p.team_size, p.stage, p.logo_url as image_url, p.video_url,
        p.valuation, p.average_rating, p.rating_count, p.progress_percentage,
        p.is_featured, p.created_at, p.updated_at,
        u.first_name, u.last_name, u.company
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      ${tagJoin}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const projects = await executeQuery(projectsQuery, [...params, parseInt(limit), parseInt(offset)]);

    // Get tags for each project
    const projectIds = projects.map(p => p.id);
    let projectTags = [];

    if (projectIds.length > 0) {
      const tagsQuery = `
        SELECT ptr.project_id, pt.id, pt.name, pt.color
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
        id: tag.id,
        name: tag.name,
        color: tag.color
      });
      return acc;
    }, {});

    // Enrich projects with calculated fields and tags
    const enrichedProjects = projects.map(project => ({
      ...project,
      funding_percentage: project.funding_goal > 0 ? 
        Math.round((project.current_funding / project.funding_goal) * 100) : 0,
      owner: {
        first_name: project.first_name,
        last_name: project.last_name,
        company: project.company
      },
      tags: tagsByProject[project.id] || [],
      // Add image aliases for frontend compatibility
      image_url: project.image_url,
      image: project.image_url,
      // Remove individual owner fields
      first_name: undefined,
      last_name: undefined,
      company: undefined
    }));

    res.json({
      success: true,
      data: {
        projects: enrichedProjects,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit),
          has_next: offset + projects.length < total,
          has_prev: page > 1
        },
        filters_applied: {
          search: search || null,
          category: category || null,
          stage: stage || null,
          location: location || null,
          funding_range: {
            min: funding_min ? parseFloat(funding_min) : null,
            max: funding_max ? parseFloat(funding_max) : null
          },
          equity_range: {
            min: equity_min ? parseFloat(equity_min) : null,
            max: equity_max ? parseFloat(equity_max) : null
          },
          tags: tags ? tags.split(',') : [],
          featured_only: featured_only === 'true',
          min_rating: min_rating ? parseFloat(min_rating) : null
        }
      }
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to search projects' 
    });
  }
});

// Update project (project owners only, own projects only)
router.put('/:id', verifyToken, requireRole(['project_owner']), validateProjectUpdate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists and belongs to user
    const project = await getOne(
      'SELECT id, owner_id, project_status FROM projects WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Handle different update scenarios based on project status
    let newStatus = project.project_status;
    
    if (['draft', 'rejected'].includes(project.project_status)) {
      // Draft and rejected projects can be updated normally
      newStatus = project.project_status;
    } else if (['approved'].includes(project.project_status)) {
      // Approved projects get pending_update status when edited
      newStatus = 'pending_update';
    } else {
      // Submitted, pending, under_review projects cannot be updated
      return res.status(403).json({ 
        error: 'Cannot update project while it is under review. Please wait for admin approval or rejection.' 
      });
    }

    const {
      title, description, category, industry, funding_goal, funding_from_other_sources, minimum_investment,
      equity_percentage, location, team_size, stage, project_stage, valuation, tags
    } = req.body;

    // Map frontend field names to backend field names
    const actualCategory = category || industry;
    const actualStage = stage || project_stage;

    // Build update query
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (actualCategory !== undefined) {
      updates.push('industry = ?');
      params.push(actualCategory);
    }
    if (funding_goal !== undefined) {
      updates.push('funding_goal = ?');
      params.push(funding_goal);
    }
    if (funding_from_other_sources !== undefined) {
      updates.push('funding_from_other_sources = ?');
      params.push(funding_from_other_sources);
    }
    if (minimum_investment !== undefined) {
      updates.push('minimum_investment = ?');
      params.push(minimum_investment);
    }
    if (equity_percentage !== undefined) {
      updates.push('equity_percentage = ?');
      params.push(equity_percentage);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (team_size !== undefined) {
      updates.push('team_size = ?');
      params.push(team_size);
    }
    if (actualStage !== undefined) {
      updates.push('stage = ?');
      params.push(actualStage);
    }
    if (valuation !== undefined) {
      updates.push('valuation = ?');
      params.push(valuation);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      params.push(tags);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Update project status based on current status
    if (newStatus !== project.project_status) {
      updates.push('project_status = ?');
      params.push(newStatus);
    }

    params.push(id);

    await executeQuery(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedProject = await getOne(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// FILE UPLOAD ROUTES

// Upload files for a project (project owners only)
router.post('/:id/upload', verifyToken, requireRole(['project_owner']), upload.array('files', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { file_type = 'document', description = '' } = req.body;

    // Check if project exists and belongs to user
    const project = await getOne(
      'SELECT id, owner_id FROM projects WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadedFiles = [];

    // Save file information to database
    for (const file of req.files) {
      const fileId = 'FILE' + Date.now() + Math.random().toString(36).substr(2, 5);
      const fileUrl = `/uploads/projects/${file.filename}`;

      await executeQuery(
        `INSERT INTO project_files (
          id, project_id, file_name, original_name, file_path, file_url, 
          file_size, mime_type, file_type, description, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileId, id, file.filename, file.originalname, file.path, 
          fileUrl, file.size, file.mimetype, file_type, description, req.user.id
        ]
      );

      uploadedFiles.push({
        id: fileId,
        file_name: file.filename,
        original_name: file.originalname,
        file_url: fileUrl,
        file_size: file.size,
        mime_type: file.mimetype,
        file_type: file_type,
        description: description
      });
    }

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });

  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Get files for a project
router.get('/:id/files', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { file_type } = req.query;

    // Check if user has access to project
    const project = await getOne(
      `SELECT p.id, p.owner_id, p.status 
       FROM projects p 
       WHERE p.id = ? AND (
         p.status = 'approved' OR 
         p.owner_id = ? OR 
         ? = 'admin'
       )`,
      [id, req.user.id, req.user.role]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    let whereClause = 'WHERE project_id = ?';
    const params = [id];

    if (file_type) {
      whereClause += ' AND file_type = ?';
      params.push(file_type);
    }

    const files = await executeQuery(
      `SELECT 
        id, file_name, original_name, file_url, file_size, 
        mime_type, file_type, description, created_at
       FROM project_files 
       ${whereClause} 
       ORDER BY created_at DESC`,
      params
    );

    res.json({
      project_id: id,
      files: files
    });

  } catch (error) {
    console.error('Get project files error:', error);
    res.status(500).json({ error: 'Failed to fetch project files' });
  }
});

// Delete a project file (project owners only)
router.delete('/:id/files/:fileId', verifyToken, requireRole(['project_owner']), async (req, res) => {
  try {
    const { id, fileId } = req.params;

    // Check if project exists and belongs to user
    const project = await getOne(
      'SELECT id, owner_id FROM projects WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    // Get file information
    const file = await getOne(
      'SELECT id, file_name, file_path FROM project_files WHERE id = ? AND project_id = ?',
      [fileId, id]
    );

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete file record from database
    await executeQuery(
      'DELETE FROM project_files WHERE id = ? AND project_id = ?',
      [fileId, id]
    );

    res.json({ message: 'File deleted successfully' });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Upload project image/logo
router.post('/:id/image', verifyToken, requireRole(['project_owner']), upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { image_type = 'main' } = req.body; // main, logo, gallery

    console.log(`[IMAGE UPLOAD] Starting upload for project ${id}`, {
      userId: req.user.id,
      fileSize: req.file ? req.file.size : 'No file',
      fileName: req.file ? req.file.originalname : 'No file',
      mimeType: req.file ? req.file.mimetype : 'No file'
    });

    // Check if project exists and belongs to user
    const project = await getOne(
      'SELECT id, owner_id, logo_url as image_url FROM projects WHERE id = ? AND owner_id = ?',
      [id, req.user.id]
    );

    if (!project) {
      console.log(`[IMAGE UPLOAD] Project not found or access denied: ${id} for user ${req.user.id}`);
      return res.status(404).json({ error: 'Project not found or access denied' });
    }

    if (!req.file) {
      console.log(`[IMAGE UPLOAD] No image file provided for project ${id}`);
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Check if file is an image
    if (!req.file.mimetype.startsWith('image/')) {
      console.log(`[IMAGE UPLOAD] Invalid file type: ${req.file.mimetype} for project ${id}`);
      // Delete uploaded file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'File must be an image' });
    }

    const imageUrl = `/uploads/projects/${req.file.filename}`;
    console.log(`[IMAGE UPLOAD] Generated image URL: ${imageUrl}`);

    // Update project with new image URL
    if (image_type === 'main') {
      // Delete old main image if exists
      if (project.image_url) {
        const oldImagePath = path.join('/var/www', project.image_url);
        if (fs.existsSync(oldImagePath)) {
          console.log(`[IMAGE UPLOAD] Deleting old image: ${oldImagePath}`);
          fs.unlinkSync(oldImagePath);
        }
      }

      console.log(`[IMAGE UPLOAD] Updating project ${id} with image URL: ${imageUrl}`);
      await executeQuery(
        'UPDATE projects SET logo_url = ? WHERE id = ?',
        [imageUrl, id]
      );
    }

    // Save image record (only if project_files table exists)
    try {
      const fileId = 'IMG' + Date.now() + Math.random().toString(36).substr(2, 5);
      await executeQuery(
        `INSERT INTO project_files (
          id, project_id, file_name, original_name, file_path, file_url, 
          file_size, mime_type, file_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fileId, id, req.file.filename, req.file.originalname, req.file.path, 
          imageUrl, req.file.size, req.file.mimetype, image_type, req.user.id
        ]
      );
      console.log(`[IMAGE UPLOAD] File record saved with ID: ${fileId}`);
    } catch (fileError) {
      // Continue even if file record fails - main image update is more important
      console.warn(`[IMAGE UPLOAD] Failed to save file record (continuing anyway):`, fileError.message);
    }

    console.log(`[IMAGE UPLOAD] Upload successful for project ${id}`);
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image_url: imageUrl,
      data: {
        project_id: id,
        image_url: imageUrl,
        file_name: req.file.filename
      }
    });

  } catch (error) {
    console.error(`[IMAGE UPLOAD] Error for project ${req.params.id}:`, error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      console.log(`[IMAGE UPLOAD] Cleaning up failed upload: ${req.file.path}`);
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message,
      project_id: req.params.id
    });
  }
});

// ADMIN ROUTES

// Get all projects for admin review
router.get('/admin/all', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category, search, sort = 'created_at' } = req.query;
    const offset = (page - 1) * limit;

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
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ? OR u.company LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Determine sort order
    let orderBy = 'ORDER BY p.created_at DESC';
    switch (sort) {
      case 'title':
        orderBy = 'ORDER BY p.title ASC';
        break;
      case 'funding_goal':
        orderBy = 'ORDER BY p.funding_goal DESC';
        break;
      case 'status':
        orderBy = 'ORDER BY p.status ASC, p.created_at DESC';
        break;
      case 'owner':
        orderBy = 'ORDER BY u.company ASC, u.first_name ASC';
        break;
      default:
        orderBy = 'ORDER BY p.created_at DESC';
    }

    // Get total count
    const totalResult = await executeQuery(
      `SELECT COUNT(*) as total FROM projects p 
       JOIN users u ON p.owner_id = u.id 
       ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    // Get projects with owner info
    const projects = await executeQuery(
      `SELECT 
        p.id, p.title, p.description, p.industry, p.funding_goal, 
        p.current_funding, p.funding_from_other_sources, p.valuation,
        p.location, p.team_size, p.stage, p.project_status, 
        p.logo_url as image_url, p.pitch_deck_url, p.tags, p.created_at, p.updated_at,
        p.rejection_reason, p.is_featured,
        u.id as owner_id, u.first_name, u.last_name, u.email, u.company
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       ${whereClause}
       ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Add calculated fields
    const projectsWithStats = projects.map(project => ({
      ...project,
      funding_percentage: project.funding_goal > 0 ? 
        Math.round((project.current_funding / project.funding_goal) * 100) : 0,
      owner_name: `${project.first_name} ${project.last_name}`,
      days_since_submission: Math.floor(
        (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      // Add image_url alias for frontend compatibility
      image_url: project.image_url,
      image: project.image_url
    }));

    res.json({
      success: true,
      data: {
        projects: projectsWithStats,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total,
          total_pages: Math.ceil(total / limit),
          has_next: offset + projects.length < total,
          has_prev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all projects (admin) error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch projects for admin review' 
    });
  }
});

// Get admin dashboard statistics
router.get('/admin/stats', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    // Get project counts by status
    const statusCounts = await executeQuery(
      `SELECT 
        status,
        COUNT(*) as count
       FROM projects 
       GROUP BY status`
    );

    // Get total funding statistics
    const fundingStats = await getOne(
      `SELECT 
        COUNT(*) as total_projects,
        SUM(funding_goal) as total_funding_goal,
        SUM(current_funding) as total_current_funding,
        AVG(progress_percentage) as avg_progress
       FROM projects 
       WHERE status = 'approved'`
    );

    // Get recent activity (projects submitted in last 7 days)
    const recentActivity = await executeQuery(
      `SELECT 
        p.id, p.title, p.status, p.created_at,
        u.first_name, u.last_name, u.company
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY p.created_at DESC
       LIMIT 10`
    );

    // Get category breakdown for approved projects
    const categoryBreakdown = await executeQuery(
      `SELECT 
        category, 
        COUNT(*) as count,
        SUM(current_funding) as total_funding
       FROM projects 
       WHERE status = 'approved'
       GROUP BY category
       ORDER BY count DESC`
    );

    // Format status counts for easier frontend consumption
    const statusMap = statusCounts.reduce((acc, item) => {
      acc[item.status] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        project_counts: {
          total: Object.values(statusMap).reduce((sum, count) => sum + count, 0),
          pending: statusMap.pending || 0,
          approved: statusMap.approved || 0,
          rejected: statusMap.rejected || 0,
          draft: statusMap.draft || 0,
          under_review: statusMap.under_review || 0,
          funded: statusMap.funded || 0,
          completed: statusMap.completed || 0
        },
        funding_stats: {
          ...fundingStats,
          total_funding_goal: parseFloat(fundingStats.total_funding_goal || 0),
          total_current_funding: parseFloat(fundingStats.total_current_funding || 0),
          avg_progress: parseFloat(fundingStats.avg_progress || 0).toFixed(1)
        },
        recent_activity: recentActivity.map(activity => ({
          ...activity,
          owner_name: `${activity.first_name} ${activity.last_name}`
        })),
        category_breakdown: categoryBreakdown
      }
    });

  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admin statistics' 
    });
  }
});

// Approve project (admin only)
router.put('/admin/:id/approve', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    // Check if project exists
    const project = await getOne(
      'SELECT id, title, project_status, owner_id FROM projects WHERE id = ?',
      [id]
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Update project status to approved
    await executeQuery(
      `UPDATE projects 
       SET project_status = 'approved', 
           rejection_reason = NULL
       WHERE id = ?`,
      [id]
    );

    // Admin logging would go here if admin_logs table exists

    res.json({
      success: true,
      message: `Project "${project.title}" approved successfully`
    });

  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to approve project' 
    });
  }
});

// Reject project (admin only)
router.put('/admin/:id/reject', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { rejected_reason, admin_notes } = req.body;

    if (!rejected_reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rejection reason is required' 
      });
    }

    // Check if project exists
    const project = await getOne(
      'SELECT id, title, project_status, owner_id FROM projects WHERE id = ?',
      [id]
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Update project status to rejected
    await executeQuery(
      `UPDATE projects 
       SET project_status = 'rejected', 
           rejection_reason = ?
       WHERE id = ?`,
      [rejected_reason, id]
    );

    // Admin logging would go here if admin_logs table exists

    res.json({
      success: true,
      message: `Project "${project.title}" rejected successfully`
    });

  } catch (error) {
    console.error('Reject project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reject project' 
    });
  }
});

// Admin edit project
router.put('/admin/:id/edit', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    // Check if project exists
    const project = await getOne('SELECT id, title FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found' 
      });
    }

    // Build dynamic update query
    const allowedFields = [
      'title', 'description', 'short_description', 'industry', 'subcategory',
      'funding_goal', 'minimum_investment', 'equity_percentage', 'location',
      'team_size', 'stage', 'valuation', 'is_featured'
    ];

    const updates = [];
    const params = [];

    Object.keys(updateFields).forEach(field => {
      if (allowedFields.includes(field) && updateFields[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(updateFields[field]);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }

    params.push(id);

    await executeQuery(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    // Log admin action
    await executeQuery(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_values, ip_address)
       VALUES (?, 'edit_project', 'project', ?, ?, ?)`,
      [req.user.id, id, JSON.stringify(updateFields), req.ip]
    );

    // Get updated project
    const updatedProject = await getOne(
      `SELECT p.*, u.first_name, u.last_name, u.company
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });

  } catch (error) {
    console.error('Admin edit project error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update project' 
    });
  }
});

// Toggle project featured status (admin only)
router.put('/admin/:id/featured', verifyToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_featured } = req.body;

    // Check if project exists and is approved
    const project = await getOne(
      'SELECT id, title, is_featured FROM projects WHERE id = ? AND status = "approved"',
      [id]
    );

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: 'Project not found or not approved' 
      });
    }

    await executeQuery(
      'UPDATE projects SET is_featured = ? WHERE id = ?',
      [is_featured, id]
    );

    // Log admin action
    await executeQuery(
      `INSERT INTO admin_logs (admin_id, action, entity_type, entity_id, new_values, ip_address)
       VALUES (?, 'toggle_featured', 'project', ?, ?, ?)`,
      [req.user.id, id, JSON.stringify({ is_featured }), req.ip]
    );

    res.json({
      success: true,
      message: `Project "${project.title}" ${is_featured ? 'featured' : 'unfeatured'} successfully`
    });

  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle featured status' 
    });
  }
});

module.exports = router;