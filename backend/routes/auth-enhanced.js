const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const session = require('express-session');
const { executeQuery, getOne } = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { validateUserLogin, validateUserRegistration } = require('../middleware/validation');
const otpService = require('../services/otpService');
const authDetectionService = require('../services/authDetectionService');
const oauthService = require('../services/oauthService');

const router = express.Router();

// Initialize passport
router.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 15 * 60 * 1000 } // 15 minutes
}));

router.use(passport.initialize());
router.use(passport.session());

// Generate tokens
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.user_type || user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '24h',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

  return { accessToken, refreshToken };
};

// Intelligent auth detection endpoint
router.post('/detect-auth', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const detection = await authDetectionService.detectAuthMethods(email);

    res.json({
      success: true,
      data: detection
    });

  } catch (error) {
    console.error('Auth detection error:', error);
    res.status(500).json({ error: 'Failed to detect authentication methods' });
  }
});

// Enhanced signup with OTP verification
router.post('/signup-enhanced', validateUserRegistration, async (req, res) => {
  try {
    const {
      email, password, first_name, last_name, user_type,
      company, location, phone_number, telegram_handle,
      website_url, linkedin, investment_focus, preferred_category,
      investment_range, current_portfolio_size, past_investments
    } = req.body;

    // Check if user already exists
    const existingUser = await getOne(
      'SELECT id, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      if (existingUser.is_verified) {
        return res.status(400).json({
          error: 'User with this email already exists and is verified',
          errorCode: 'USER_EXISTS'
        });
      } else {
        // User exists but not verified - resend OTP
        const otpResult = await otpService.generateAndSendOTP(
          existingUser.id,
          email,
          'email_verification',
          first_name
        );

        return res.status(200).json({
          message: 'Account exists but not verified. Verification email sent.',
          userId: existingUser.id,
          requiresVerification: true,
          otpSent: otpResult.success
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate user ID
    const userId = 'USR' + Date.now() + Math.random().toString(36).substr(2, 5);

    // Insert new user with enhanced fields
    await executeQuery(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, user_type,
        company, location, phone, linkedin_url, website_url,
        is_verified, is_active, approval_status, profile_completion_step
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, email, password_hash, first_name, last_name, user_type,
        company || null, location || null, phone_number || null,
        linkedin || null, website_url || null,
        false, true, 'pending', 'verification'
      ]
    );

    // Add password authentication method
    await authDetectionService.addAuthMethod(userId, 'password');

    // Send OTP for email verification
    const otpResult = await otpService.generateAndSendOTP(
      userId,
      email,
      'email_verification',
      first_name
    );

    res.status(201).json({
      message: 'Account created successfully. Please verify your email.',
      userId: userId,
      requiresVerification: true,
      otpSent: otpResult.success,
      nextStep: 'verify_email'
    });

  } catch (error) {
    console.error('Enhanced signup error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Verify email with OTP
router.post('/verify-email', async (req, res) => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    // Verify OTP
    const verification = await otpService.verifyOTP(email, otpCode, 'email_verification');

    if (!verification.success) {
      return res.status(400).json({
        error: verification.error,
        errorCode: verification.errorCode
      });
    }

    // Update user verification status
    await executeQuery(
      `UPDATE users SET
       is_verified = TRUE,
       profile_completion_step = 'approval',
       email_verification_token = NULL,
       email_verification_expires = NULL
       WHERE id = ?`,
      [verification.userId]
    );

    // Get updated user
    const user = await getOne(
      'SELECT id, email, first_name, last_name, user_type, company, location, is_verified, approval_status FROM users WHERE id = ?',
      [verification.userId]
    );

    res.json({
      success: true,
      message: 'Email verified successfully',
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
      nextStep: user.approval_status === 'pending' ? 'pending_approval' : 'complete'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, type = 'email_verification' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check rate limiting
    const hasPending = await otpService.hasPendingOTP(email, type, 2);
    if (hasPending) {
      return res.status(429).json({
        error: 'Please wait before requesting another OTP',
        errorCode: 'RATE_LIMITED'
      });
    }

    // Get user
    const user = await getOne(
      'SELECT id, first_name FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send OTP
    const otpResult = await otpService.generateAndSendOTP(
      user.id,
      email,
      type,
      user.first_name
    );

    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.error });
    }

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
});

// Enhanced login with intelligent auth detection
router.post('/login-enhanced', async (req, res) => {
  try {
    const { email, password, otpCode, loginMethod = 'password' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Detect available auth methods
    const detection = await authDetectionService.detectAuthMethods(email);

    if (!detection.exists) {
      return res.status(404).json({
        error: 'No account found with this email',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    const user = detection.user;

    // Check verification status
    if (!user.isVerified) {
      // Send verification OTP
      const otpResult = await otpService.generateAndSendOTP(
        user.id,
        email,
        'email_verification',
        user.firstName
      );

      return res.status(403).json({
        error: 'Email not verified',
        errorCode: 'EMAIL_NOT_VERIFIED',
        requiresVerification: true,
        otpSent: otpResult.success,
        userId: user.id
      });
    }

    // Check approval status
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        error: 'Account has been rejected',
        errorCode: 'ACCOUNT_REJECTED',
        requiresResubmission: true
      });
    }

    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        error: 'Account pending approval',
        errorCode: 'ACCOUNT_PENDING',
        message: 'Your account is under review. You will receive an email once approved.'
      });
    }

    // Handle different login methods
    if (loginMethod === 'password') {
      if (!detection.methods.includes('password')) {
        return res.status(400).json({
          error: 'Password login not available for this account',
          availableMethods: detection.methods,
          suggestions: detection.suggestions
        });
      }

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      // Get full user record with password
      const fullUser = await getOne(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email]
      );

      // Verify password
      const isValidPassword = await bcrypt.compare(password, fullUser.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }

      // Update last login
      await executeQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [fullUser.id]
      );

      // Generate tokens
      const tokens = generateTokens(fullUser);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: fullUser.id,
          email: fullUser.email,
          first_name: fullUser.first_name,
          last_name: fullUser.last_name,
          role: fullUser.user_type,
          company: fullUser.company,
          location: fullUser.location,
          is_verified: fullUser.is_verified,
          approval_status: fullUser.approval_status
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });

    } else if (loginMethod === 'otp') {
      if (!otpCode) {
        return res.status(400).json({ error: 'OTP code is required' });
      }

      // Verify OTP
      const verification = await otpService.verifyOTP(email, otpCode, 'login');

      if (!verification.success) {
        return res.status(400).json({
          error: verification.error,
          errorCode: verification.errorCode
        });
      }

      // Get full user record
      const fullUser = await getOne(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [verification.userId]
      );

      // Update last login
      await executeQuery(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [fullUser.id]
      );

      // Generate tokens
      const tokens = generateTokens(fullUser);

      res.json({
        success: true,
        message: 'OTP login successful',
        user: {
          id: fullUser.id,
          email: fullUser.email,
          first_name: fullUser.first_name,
          last_name: fullUser.last_name,
          role: fullUser.user_type,
          company: fullUser.company,
          location: fullUser.location,
          is_verified: fullUser.is_verified,
          approval_status: fullUser.approval_status
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });

    } else {
      return res.status(400).json({
        error: 'Invalid login method',
        availableMethods: detection.methods,
        suggestions: detection.suggestions
      });
    }

  } catch (error) {
    console.error('Enhanced login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Request OTP for login (passwordless)
router.post('/request-login-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists and is eligible for OTP login
    const user = await getOne(
      'SELECT id, first_name, is_verified, approval_status FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        errorCode: 'EMAIL_NOT_VERIFIED'
      });
    }

    if (user.approval_status !== 'approved') {
      return res.status(403).json({
        error: 'Account not approved',
        errorCode: 'ACCOUNT_NOT_APPROVED'
      });
    }

    // Check rate limiting
    const hasPending = await otpService.hasPendingOTP(email, 'login', 2);
    if (hasPending) {
      return res.status(429).json({
        error: 'Please wait before requesting another login code',
        errorCode: 'RATE_LIMITED'
      });
    }

    // Send login OTP
    const otpResult = await otpService.generateAndSendOTP(
      user.id,
      email,
      'login',
      user.first_name
    );

    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.error });
    }

    res.json({
      success: true,
      message: 'Login code sent to your email'
    });

  } catch (error) {
    console.error('Request login OTP error:', error);
    res.status(500).json({ error: 'Failed to send login code' });
  }
});

// Get current user profile (enhanced)
router.get('/me-enhanced', verifyToken, async (req, res) => {
  try {
    const user = await getOne(
      `SELECT id, email, first_name, last_name, user_type, company, location,
              is_verified, approval_status, profile_completion_step,
              avatar_url, linkedin_url, website_url, created_at, investment_focus, investment_range, current_portfolio_size, past_investments
,bio, portfolio_size,investment_categories ,phone      FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log("user", user)

    // Get authentication methods
    const authMethods = await executeQuery(
      'SELECT auth_method, is_primary, provider_email FROM user_auth_methods WHERE user_id = ? AND is_active = TRUE',
      [req.user.id]
    );

    res.json({
      success: true,
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
        profile_completion_step: user.profile_completion_step,
        avatar_url: user.avatar_url,
        linkedin_url: user.linkedin_url,
        website_url: user.website_url,
        created_at: user.created_at,
        auth_methods: authMethods,
        investment_focus_list: user.investment_focus ? user.investment_focus.split(',') : [],
        investment_range: user.investment_range,
        current_portfolio_size: user.current_portfolio_size,
        past_investments: user.past_investments,
        bio: user.bio,
        portfolio_size: user.portfolio_size,
        investment_categories: user.investment_categories ? user.investment_categories.split(',') : [],
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Get enhanced profile error:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Include OAuth routes
const oauthRoutes = require('./oauth');
router.use('/oauth', oauthRoutes);

module.exports = router;