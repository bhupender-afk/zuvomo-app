const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { executeQuery, getOne } = require('../config/database');
const otpService = require('../services/otpService');
const router = express.Router();

// Enhanced user status detection endpoint
router.post('/detect-auth', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists and get complete status
    const user = await getOne(
      `SELECT id, email, first_name, last_name, user_type, is_verified,
              approval_status, enhanced_signup, profile_completion_step,
              created_at FROM users WHERE email = ?`,
      [email]
    );

    if (!user) {
      return res.json({
        success: true,
        exists: false,
        message: 'User not found. Please sign up to create an account.',
        methods: [],
        socialProviders: [],
        suggestions: ['Sign up for a new account'],
        requiresVerification: false,
        requiresApproval: false,
        nextStep: 'signup'
      });
    }

    // Determine available authentication methods
    const methods = ['otp']; // OTP is always available
    if (user.user_type === 'admin') {
      methods.unshift('password'); // Admins get password first
    } else if (user.is_verified) {
      methods.unshift('password'); // Verified users can use password
    }

    // Determine user status and next steps
    let message = `Welcome back, ${user.first_name}!`;
    let requiresVerification = false;
    let requiresApproval = false;
    let nextStep = 'authenticate';

    // Check verification status for non-admin users
    if (user.user_type !== 'admin' && !user.is_verified) {
      requiresVerification = true;
      message = `Hi ${user.first_name}, please verify your email first.`;
      nextStep = 'verify_email';
    }

    // Check approval status for verified non-admin users
    if (user.user_type !== 'admin' && user.is_verified) {
      if (user.approval_status === 'pending') {
        requiresApproval = true;
        message = `Hi ${user.first_name}, your account is pending approval.`;
        nextStep = 'pending_approval';
      } else if (user.approval_status === 'rejected') {
        message = `Hi ${user.first_name}, your account was rejected. You can resubmit your application.`;
        nextStep = 'rejected';
      }
    }

    // Check profile completion
    if (user.user_type !== 'admin' && user.is_verified && user.approval_status === 'approved' && !user.enhanced_signup) {
      message = `Hi ${user.first_name}, please complete your profile.`;
      nextStep = 'complete_profile';
    }

    return res.json({
      success: true,
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.user_type,
        isVerified: user.is_verified,
        approvalStatus: user.approval_status,
        profileCompleted: user.enhanced_signup
      },
      methods,
      socialProviders: [], // TODO: Add social providers if implemented
      suggestions: [],
      message,
      nextStep,
      requiresVerification,
      requiresApproval
    });

  } catch (error) {
    console.error('Auth detection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect authentication methods'
    });
  }
});

// Generate unique user ID
const generateUserId = () => {
  return Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Initial signup endpoint - sends OTP for email verification
router.post('/initial-signup', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('userType').isIn(['investor', 'project_owner']).withMessage('Valid user type is required'),
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, email, password, userType, company, phone, websiteUrl } = req.body;

    // Check if user already exists
    const existingUserResults = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    const existingUser = existingUserResults[0];

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Split fullName into firstName and lastName for database compatibility
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate unique user ID
    const userId = generateUserId();

    // Store initial signup data in users table with pending verification status
    const insertQuery = `
      INSERT INTO users (
        id, email, password_hash, user_type, first_name, last_name, company, phone,
        is_active, is_verified, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      userId,
      email,
      hashedPassword,
      userType,
      firstName,
      lastName,
      company || null,
      phone || null,
      true, // Set active to allow login for verification
      false, // Not verified until OTP confirmed
      'pending' // All users need admin approval after email verification
    ];

    await executeQuery(insertQuery, values);

    // Generate and send OTP
    const otpResult = await otpService.generateAndSendOTP(
      userId,
      email,
      'email_verification',
      firstName
    );

    if (!otpResult.success) {
      // If OTP sending fails, we should probably delete the user record
      await executeQuery('DELETE FROM users WHERE id = ?', [userId]);
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
        error: otpResult.error
      });
    }

    res.status(201).json({
      success: true,
      message: 'Registration initiated! Please check your email for the verification code.',
      data: {
        userId,
        email,
        firstName,
        lastName,
        userType,
        requiresVerification: true
      }
    });

  } catch (error) {
    console.error('Initial signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Email verification endpoint
router.post('/verify-email', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP code must be 6 digits'),
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, otpCode } = req.body;

    // Verify OTP
    const otpResult = await otpService.verifyOTP(email, otpCode, 'email_verification');

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.error || 'Invalid or expired verification code'
      });
    }

    // Update user as email verified
    await executeQuery(
      'UPDATE users SET is_verified = true WHERE email = ?',
      [email]
    );

    // Get user data
    const user = await getOne(
      'SELECT id, email, first_name, last_name, user_type FROM users WHERE email = ?',
      [email]
    );

    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        userType: user.user_type,
        emailVerified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('type').optional().isIn(['email_verification', 'login']).withMessage('Invalid OTP type'),
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, type = 'email_verification' } = req.body;

    // Check if user exists
    const user = await getOne('SELECT id, first_name FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check rate limiting (don't allow resend within 2 minutes)
    const hasPending = await otpService.hasPendingOTP(email, type, 2);
    if (hasPending) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting another verification code'
      });
    }

    // Generate and send new OTP
    const otpResult = await otpService.generateAndSendOTP(
      user.id,
      email,
      type,
      user.first_name
    );

    if (!otpResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification code. Please try again.',
        error: otpResult.error
      });
    }

    res.json({
      success: true,
      message: 'New verification code sent successfully!'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Enhanced signup endpoint
router.post('/enhanced-signup', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('userType').isIn(['investor', 'project_owner']).withMessage('Valid user type is required'),
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      fullName,
      email,
      password,
      userType,
      company,
      location,
      bio,
      linkedinUrl,
      websiteUrl,
      phone,
      investmentRange,
      portfolioSize,
      investmentCategories,
      experienceLevel,
      investmentFocus,
      accreditedInvestor,
      marketingConsent,
      enhancedSignup
    } = req.body;

    // Check if user exists and is email verified
    const existingUser = await getOne(
      'SELECT id, is_verified, user_type FROM users WHERE email = ?',
      [email]
    );

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User not found. Please complete initial registration first.'
      });
    }

    if (!existingUser.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email not verified. Please verify your email first.'
      });
    }

    // Split fullName into firstName and lastName for database compatibility
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const role = userType || existingUser.user_type; // Use existing user type if not provided

    const userId = existingUser.id;

    // Update user with profile completion data (including investor fields)
    const updateQuery = `
      UPDATE users SET
        first_name = ?,
        last_name = ?,
        company = ?,
        location = ?,
        bio = ?,
        linkedin_url = ?,
        website_url = ?,
        phone = ?,
        investment_range = ?,
        portfolio_size = ?,
        investment_categories = ?,
        experience_level = ?,
        investment_focus = ?,
        accredited_investor = ?,
        marketing_consent = ?,
        enhanced_signup = ?,
        preferred_category = ?,
        investment_stage = ?
      WHERE id = ? AND email = ?
    `;

    const values = [
      firstName,
      lastName,
      company || null,
      location || null,
      bio || null,
      linkedinUrl || null,
      websiteUrl || null,
      phone || null,
      investmentRange || null,
      portfolioSize || null,
      investmentCategories ? JSON.stringify(investmentCategories) : null,
      experienceLevel || 'intermediate',
      investmentFocus ? JSON.stringify(investmentFocus) : null,
      accreditedInvestor || false,
      marketingConsent || false,
      enhancedSignup || true,
      investmentCategories && investmentCategories.length > 0 ? investmentCategories[0] : null, // preferred_category
      investmentFocus && investmentFocus.includes ? (investmentFocus.includes('early-stage') ? 'early-stage' : 'growth') : null, // investment_stage
      userId,
      email
    ];

    const result = await executeQuery(updateQuery, values);

    // Use the generated userId since we provided our own ID

    // Note: Admin notifications and signup progress tracking will be added later
    // when the additional tables are created

    res.status(201).json({
      success: true,
      message: 'Profile completed successfully!',
      data: {
        userId,
        email,
        role,
        firstName,
        lastName
      }
    });

  } catch (error) {
    console.error('Enhanced signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get pending approvals for admin dashboard
router.get('/pending-approvals', async (req, res) => {
  try {
    // This endpoint should be protected by admin auth middleware
    // For now, returning basic user data

    const query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.user_type,
        u.company,
        u.location,
        u.bio,
        u.linkedin_url,
        u.website_url,
        u.created_at
      FROM users u
      WHERE u.is_verified = true AND u.is_active = true
      ORDER BY u.created_at DESC
    `;

    const users = await executeQuery(query);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// Approve user (simplified for now)
router.post('/approve-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const updateQuery = `
      UPDATE users
      SET is_active = true,
          is_verified = true
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [userId]);

    res.json({
      success: true,
      message: 'User approved successfully'
    });

  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve user'
    });
  }
});

// Reject user (simplified for now)
router.post('/reject-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const updateQuery = `
      UPDATE users
      SET is_active = false
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [userId]);

    res.json({
      success: true,
      message: 'User rejected successfully'
    });

  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject user'
    });
  }
});

module.exports = router;