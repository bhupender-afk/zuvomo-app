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
    console.log('AUTH DEBUG - User login attempt:', {
      email: user.email,
      user_type: user.user_type,
      approval_status: user.approval_status,
      is_active: user.is_active,
      is_verified: user.is_verified
    });

    if (user.user_type !== 'admin' && user.approval_status !== 'approved') {
      console.log('AUTH DEBUG - User not approved, checking status:', user.approval_status);

      if (user.approval_status === 'rejected') {
        console.log('AUTH DEBUG - Returning ACCOUNT_REJECTED error with accessToken');

        // Generate tokens for rejected users so they can access their profile data
        const { accessToken, refreshToken } = generateTokens(user);

        return res.status(403).json({
          error: 'ACCOUNT_REJECTED',
          message: 'Your account has been rejected. Please resubmit your application.',
          status: user.approval_status,
          userType: user.user_type,
          redirectTo: user.user_type === 'investor' ? 'investor-resubmit' : 'project-owner-resubmit',
          accessToken,
          refreshToken
        });
      } else if (user.approval_status === 'pending') {
        console.log('AUTH DEBUG - Returning ACCOUNT_PENDING error with accessToken');

        // Generate tokens for pending users so they can access their profile data
        const { accessToken, refreshToken } = generateTokens(user);

        return res.status(403).json({
          error: 'ACCOUNT_PENDING',
          message: 'Your account is pending admin approval.',
          status: user.approval_status,
          userType: user.user_type,
          accessToken,
          refreshToken
        });
      } else {
        return res.status(403).json({
          error: 'ACCOUNT_STATUS_UNKNOWN',
          message: 'Your account status is unclear. Please contact support.',
          status: user.approval_status,
          userType: user.user_type
        });
      }
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

// Complete OAuth user profile
router.put('/complete-profile', verifyToken, async (req, res) => {
  try {
    const {
      user_type,
      company,
      location,
      bio,
      phone,
      linkedin_url,
      investment_range_min,
      investment_range_max,
      preferred_industries,
      experience_years,
      portfolio_size,
      investment_stage,
      geographic_focus
    } = req.body;

    if (!user_type || !['investor', 'project_owner'].includes(user_type)) {
      return res.status(400).json({ error: 'Valid user type is required' });
    }

    // Update user profile
    await executeQuery(
      `UPDATE users SET
        user_type = ?, company = ?, location = ?, bio = ?, phone = ?, linkedin_url = ?,
        investment_range_min = ?, investment_range_max = ?, preferred_industries = ?,
        experience_years = ?, portfolio_size = ?, investment_stage = ?, geographic_focus = ?
      WHERE id = ?`,
      [
        user_type, company, location, bio, phone, linkedin_url,
        investment_range_min, investment_range_max, preferred_industries,
        experience_years, portfolio_size, investment_stage, geographic_focus,
        req.user.id
      ]
    );

    // Get updated user data
    const updatedUser = await getOne(
      'SELECT id, email, first_name, last_name, user_type, company, location, is_verified, approval_status FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.user_type,
        company: updatedUser.company,
        location: updatedUser.location,
        is_verified: updatedUser.is_verified,
        approval_status: updatedUser.approval_status
      }
    });

  } catch (error) {
    console.error('Profile completion error:', error);
    res.status(500).json({ error: 'Failed to complete profile' });
  }
});

// Logout (invalidate tokens - would need session management for full implementation)
router.post('/logout', verifyToken, (req, res) => {
  // In a full implementation, you would invalidate the refresh token in the database
  res.json({ message: 'Logout successful' });
});

// OAuth callback routes
const axios = require('axios');

// Generate user ID
const generateUserId = () => {
  return Date.now().toString().substring(-8) + Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Google OAuth callback
// Google OAuth callback - removed to avoid redirect URI mismatch
// Google OAuth now uses /api/auth-enhanced/oauth/google/callback directly

// LinkedIn OAuth callback
router.get('/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Helper to detect frontend URL
    const getFrontendUrl = (req) => {
      if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

      const referer = req.get('Referer');
      if (referer) {
        try {
          const url = new URL(referer);
          const oauthDomains = ['google.com', 'accounts.google.com', 'linkedin.com', 'facebook.com'];
          if (!oauthDomains.some(domain => url.hostname.includes(domain))) {
            return `${url.protocol}//${url.host}`;
          }
        } catch (e) {}
      }

      return 'http://localhost:3002';
    };

    const frontendUrl = getFrontendUrl(req);

    if (error) {
      console.log('LinkedIn OAuth error:', error);
      return res.redirect(`${frontendUrl}/login?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }
    console.log('LinkedIn OAuth code received:', code);
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

     console.log('LinkedIn OAuth tokenResponse tokenResponse:', tokenResponse.data.access_token);
    const access_token = tokenResponse.data.access_token;
    // 2. Fetch user profile (with r_liteprofile)
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const linkedInProfile = profileResponse.data;
   if(!linkedInProfile){
      throw new Error('Failed to fetch LinkedIn user profile');
   }
    // 4. Check if user exists or create a new one
    let user = await getOne('SELECT * FROM users WHERE email = ?', [linkedInProfile.email]);
    let isNewUser = false;

    if (!user) {
      const userId = generateUserId();
      isNewUser = true;

      await executeQuery(
        `INSERT INTO users (
          id, email, first_name, last_name, user_type,
          is_verified, is_active, approval_status, auth_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          linkedInProfile.email,
          linkedInProfile.given_name || '',
          linkedInProfile.family_name || '',
          null,   // no default role
          true,   // verified via OAuth
          true,
          'pending', // LinkedIn OAuth users still need admin approval
          'linkedin'
        ]
      );

      user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    // 5. Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // 6. Redirect to frontend with tokens
    const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
    redirectUrl.searchParams.set('token', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);
    redirectUrl.searchParams.set('provider', 'linkedin');
    redirectUrl.searchParams.set('isNewUser', isNewUser.toString());
    redirectUrl.searchParams.set('needsProfileCompletion', (!user.user_type).toString());

    return res.redirect(redirectUrl.toString());

  } catch (err) {
    console.error('LinkedIn OAuth callback error:', err.response?.data || err.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});


module.exports = router;