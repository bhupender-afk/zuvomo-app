const express = require('express');
const { executeQuery, getOne, getTransaction } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateInvestment } = require('../middleware/validation');

const router = express.Router();

// Apply authentication to all routes
router.use(verifyToken);

// Make investment (investors only)
router.post('/', requireRole(['investor']), validateInvestment, async (req, res) => {
  const connection = await getTransaction();
  
  try {
    const { project_id, amount, investment_type = 'equity' } = req.body;

    // Check if project exists and is approved
    const project = await getOne(
      'SELECT id, title, funding_goal, current_funding, minimum_investment, status FROM projects WHERE id = ?',
      [project_id]
    );

    if (!project) {
      await connection.rollback();
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.status !== 'approved') {
      await connection.rollback();
      return res.status(400).json({ error: 'Project is not available for investment' });
    }

    if (amount < project.minimum_investment) {
      await connection.rollback();
      return res.status(400).json({ 
        error: `Minimum investment amount is $${project.minimum_investment}` 
      });
    }

    // Check if funding goal would be exceeded
    if (project.current_funding + amount > project.funding_goal) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Investment amount exceeds remaining funding goal' 
      });
    }

    // Check for existing pending investment from same investor
    const existingInvestment = await getOne(
      'SELECT id FROM investments WHERE project_id = ? AND investor_id = ? AND status = "pending"',
      [project_id, req.user.id]
    );

    if (existingInvestment) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'You already have a pending investment in this project' 
      });
    }

    // Generate investment ID
    const investmentId = 'INV' + Date.now() + Math.random().toString(36).substr(2, 5);

    // Create investment record
    await connection.execute(
      `INSERT INTO investments (
        id, project_id, investor_id, amount, investment_type, status
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [investmentId, project_id, req.user.id, amount, investment_type, 'pending']
    );

    // Update project funding (this would be confirmed after payment processing)
    await connection.execute(
      'UPDATE projects SET current_funding = current_funding + ? WHERE id = ?',
      [amount, project_id]
    );

    await connection.commit();

    // Get the created investment with project details
    const investment = await getOne(
      `SELECT i.*, p.title as project_title, p.category as project_category
       FROM investments i
       JOIN projects p ON i.project_id = p.id
       WHERE i.id = ?`,
      [investmentId]
    );

    res.status(201).json({
      message: 'Investment created successfully',
      investment
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create investment error:', error);
    res.status(500).json({ error: 'Failed to create investment' });
  } finally {
    connection.release();
  }
});

// Get user's investments
router.get('/my/investments', requireRole(['investor']), async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE i.investor_id = ?';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND i.status = ?';
      params.push(status);
    }

    // Get total count
    const totalResult = await executeQuery(
      `SELECT COUNT(*) as total FROM investments i ${whereClause}`,
      params
    );
    const total = totalResult[0].total;

    // Get investments with project details
    const investments = await executeQuery(
      `SELECT i.*, p.title as project_title, p.category as project_category,
              p.funding_goal, p.current_funding, p.status as project_status,
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              u.company as owner_company
       FROM investments i
       JOIN projects p ON i.project_id = p.id
       JOIN users u ON p.user_id = u.id
       ${whereClause}
       ORDER BY i.investment_date DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    // Add calculated fields
    const investmentsWithStats = investments.map(investment => ({
      ...investment,
      project_funding_percentage: Math.round((investment.current_funding / investment.funding_goal) * 100),
      owner_name: `${investment.owner_first_name} ${investment.owner_last_name}`
    }));

    res.json({
      investments: investmentsWithStats,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get my investments error:', error);
    res.status(500).json({ error: 'Failed to fetch investments' });
  }
});

// Get investment details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const investment = await getOne(
      `SELECT i.*, p.title as project_title, p.description as project_description,
              p.category as project_category, p.funding_goal, p.current_funding,
              p.status as project_status, p.location as project_location,
              u.first_name as owner_first_name, u.last_name as owner_last_name,
              u.company as owner_company, u.email as owner_email
       FROM investments i
       JOIN projects p ON i.project_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!investment) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Check access rights (only investor who made investment or admin)
    if (req.user.role !== 'admin' && req.user.id !== investment.investor_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...investment,
      project_funding_percentage: Math.round((investment.current_funding / investment.funding_goal) * 100),
      owner_name: `${investment.owner_first_name} ${investment.owner_last_name}`
    });

  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({ error: 'Failed to fetch investment' });
  }
});

// Cancel pending investment
router.delete('/:id', async (req, res) => {
  const connection = await getTransaction();
  
  try {
    const { id } = req.params;

    // Get investment details
    const investment = await getOne(
      'SELECT id, project_id, investor_id, amount, status FROM investments WHERE id = ?',
      [id]
    );

    if (!investment) {
      await connection.rollback();
      return res.status(404).json({ error: 'Investment not found' });
    }

    // Check access rights
    if (req.user.role !== 'admin' && req.user.id !== investment.investor_id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow cancellation of pending investments
    if (investment.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ error: 'Only pending investments can be cancelled' });
    }

    // Update investment status
    await connection.execute(
      'UPDATE investments SET status = ? WHERE id = ?',
      ['cancelled', id]
    );

    // Reduce project funding
    await connection.execute(
      'UPDATE projects SET current_funding = current_funding - ? WHERE id = ?',
      [investment.amount, investment.project_id]
    );

    await connection.commit();

    res.json({ message: 'Investment cancelled successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Cancel investment error:', error);
    res.status(500).json({ error: 'Failed to cancel investment' });
  } finally {
    connection.release();
  }
});

// Get investment portfolio summary (investors only)
router.get('/my/portfolio', requireRole(['investor']), async (req, res) => {
  try {
    // Get portfolio statistics
    const stats = await getOne(
      `SELECT 
        COUNT(*) as total_investments,
        SUM(amount) as total_invested,
        AVG(amount) as average_investment,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_investments,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_investments
       FROM investments 
       WHERE investor_id = ?`,
      [req.user.id]
    );

    // Get investments by category
    const categoryBreakdown = await executeQuery(
      `SELECT p.category, COUNT(*) as count, SUM(i.amount) as total_amount
       FROM investments i
       JOIN projects p ON i.project_id = p.id
       WHERE i.investor_id = ?
       GROUP BY p.category
       ORDER BY total_amount DESC`,
      [req.user.id]
    );

    // Get recent investments
    const recentInvestments = await executeQuery(
      `SELECT i.id, i.amount, i.investment_date, i.status,
              p.title as project_title, p.category
       FROM investments i
       JOIN projects p ON i.project_id = p.id
       WHERE i.investor_id = ?
       ORDER BY i.investment_date DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      stats: {
        ...stats,
        total_invested: parseFloat(stats.total_invested || 0),
        average_investment: parseFloat(stats.average_investment || 0),
        completed_investments: parseFloat(stats.completed_investments || 0),
        pending_investments: parseFloat(stats.pending_investments || 0)
      },
      category_breakdown: categoryBreakdown,
      recent_investments: recentInvestments
    });

  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Get project's investments (project owners for their own projects, admin for all)
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check project access
    const project = await getOne(
      'SELECT id, user_id, title FROM projects WHERE id = ?',
      [projectId]
    );

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access rights
    if (req.user.role !== 'admin' && req.user.id !== project.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const investments = await executeQuery(
      `SELECT i.id, i.amount, i.investment_type, i.status, i.investment_date,
              u.first_name, u.last_name, u.company
       FROM investments i
       JOIN users u ON i.investor_id = u.id
       WHERE i.project_id = ?
       ORDER BY i.investment_date DESC`,
      [projectId]
    );

    const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const investorCount = new Set(investments.map(inv => inv.investor_id)).size;

    res.json({
      project_title: project.title,
      investments,
      summary: {
        total_invested: totalInvested,
        investor_count: investorCount,
        investment_count: investments.length
      }
    });

  } catch (error) {
    console.error('Get project investments error:', error);
    res.status(500).json({ error: 'Failed to fetch project investments' });
  }
});

module.exports = router;