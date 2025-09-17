const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { validateUserLogin, validateUserRegistration } = require('../middleware/validation');

const router = express.Router();

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.user_type,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

  return { accessToken, refreshToken };
};

// Register new user
router.post('/signup', validateUserRegistration, async (req, res) => {
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

    // Insert new user
    await executeQuery(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, user_type, 
        company, location, is_verified, is_active, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, password_hash, first_name, last_name, user_type, company || null, location || null, false, true, 'pending']
    );

    // Get created user
    const user = await getOne(
      'SELECT id, email, first_name, last_name, user_type, company, location, is_verified, approval_status FROM users WHERE id = ?',
      [userId]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      message: 'User registered successfully',
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
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Get user from database
    const user = await getOne(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is approved (for non-admin users)
    if (user.user_type !== 'admin' && user.approval_status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        status: user.approval_status 
      });
    }

    // Update last login
    await executeQuery(
      'UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      message: 'Login successful',
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
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Get user from database
    const user = await getOne(
      'SELECT id, email, first_name, last_name, user_type, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      message: 'Tokens refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Get current user profile
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await getOne(
      'SELECT id, email, first_name, last_name, user_type, company, location, is_verified, approval_status, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.user_type,
        company: user.company,
        location: user.location,
        is_verified: user.is_verified,
        approval_status: user.approval_status,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Logout (invalidate tokens - would need session management for full implementation)
router.post('/logout', verifyToken, (req, res) => {
  // In a full implementation, you would invalidate the refresh token in the database
  res.json({ message: 'Logout successful' });
});

module.exports = router;