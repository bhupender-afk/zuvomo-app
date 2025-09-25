const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { executeQuery, getOne } = require('../config/database');
const otpService = require('../services/otpService');
const { verifyToken } = require('../middleware/auth');
const axios = require('axios');

const router = express.Router();

// Generate user ID
const generateUserId = () => {
  return Date.now().toString().substring(-8) + Math.random().toString(36).substring(2, 6).toUpperCase();
};

// Generate access and refresh tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.user_type || user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Transform database user to enhanced user (essential fields only)
const transformUserToEnhanced = (dbUser) => {
  return {
    // Step 1 essential fields
    id: dbUser.id,
    email: dbUser.email,
    first_name: dbUser.first_name,
    last_name: dbUser.last_name,
    user_type: dbUser.user_type,
    role: dbUser.user_type, // use user_type as role

    // Step 2 essential fields
    location: dbUser.location,
    phone: dbUser.phone,
    website_url: dbUser.website_url,
    linkedin_url: dbUser.linkedin_url,
    bio: dbUser.bio,

    // Investor-specific fields
    investment_range: dbUser.investment_range,
    investment_focus: dbUser.investment_focus,
    investment_categories: dbUser.investment_categories ? dbUser.investment_categories : [],
    accredited_investor: Boolean(dbUser.accredited_investor),

    // System fields
    is_verified: Boolean(dbUser.is_verified),
    approval_status: dbUser.approval_status || 'pending'
  };
};

// 1. Detect authentication methods for an email
router.post('/detect-auth', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    console.log("useruser:", user);

    if (!user) {
      return res.json({
        success: true,
        data: {
          exists: false,
          methods: [],
          socialProviders: [],
          suggestions: ['password', 'google'],
          message: "It looks like you're new here! You can sign up with email & password or use Google.",
          requiresVerification: false,
          requiresApproval: false
        }
      });
    }

    // Determine available authentication methods
    const methods = [];
    if (user.password_hash) {
      methods.push('password');
    }
    methods.push('otp'); // OTP is always available

    // Check for social providers based on user's auth_method and registration history
    const socialProviders = [];

    // If user registered with OAuth, include their primary OAuth method
    if (user.auth_method === 'google') {
      socialProviders.push('google');
    } else if (user.auth_method === 'linkedin') {
      socialProviders.push('linkedin');
    }

    // For users who originally registered with password, allow OAuth as additional option
    if (user.auth_method === 'password') {
      // Always suggest Google and LinkedIn as available options for password users
      socialProviders.push('google', 'linkedin');
    }

    // For OAuth users, allow login via their registered method
    if (socialProviders.length > 0) {
      // OAuth methods are available for login
      methods.push(...socialProviders);
    }

    // Create personalized message
    let message = `Welcome back, ${user.first_name}!`;

    const hasPassword = methods.includes('password');
    const hasOAuth = socialProviders.length > 0;
    const oauthText = socialProviders.length === 1 ? socialProviders[0] : 'social media';

    if (hasPassword && hasOAuth) {
      message += ` You can sign in with your password, ${oauthText}, or request a login code.`;
    } else if (hasPassword && methods.includes('otp')) {
      message += ' You can sign in with your password or request a login code.';
    } else if (hasPassword) {
      message += ' Please enter your password to sign in.';
    } else if (hasOAuth) {
      message += ` You can sign in with ${oauthText} or request a login code.`;
    } else {
      message += " We'll send you a login code via email.";
    }

    // Auto-verify OAuth users if they're not already verified
    if (!user.is_verified && ['google', 'linkedin'].includes(user.auth_method)) {
      await executeQuery('UPDATE users SET is_verified = ? WHERE id = ?', [true, user.id]);
      user.is_verified = true;
      console.log(`Auto-verified OAuth user: ${user.email}`);
    }

    // Determine the next step in the authentication flow
    let nextStep = 'authenticate'; // default for most users

    if (user.user_type === 'admin') {
      // Admin users always go directly to authentication
      nextStep = 'authenticate';
    } else if (!user.is_verified && !['google', 'linkedin'].includes(user.auth_method)) {
      // Unverified users need email verification first (except OAuth users)
      nextStep = 'verify_email';

      // Automatically send OTP for email verification
      try {
        const otpResult = await otpService.generateAndSendOTP(
          user.id,
          user.email,
          'email_verification',
          user.first_name
        );

        if (otpResult.success) {
          console.log(`OTP sent automatically to unverified user: ${user.email}`);
        } else {
          console.error(`Failed to auto-send OTP to ${user.email}:`, otpResult.error);
        }
      } catch (otpError) {
        console.error('Auto OTP sending error:', otpError);
      }
    } else if (user.approval_status === 'rejected') {
      // Rejected users can resubmit their application
      nextStep = 'rejected';
    } else if (user.approval_status === 'pending') {
      if(user.user_type === 'investor' && (!user.investment_range || !user.investment_categories)) {
        // Investors need to complete their profile
        nextStep = 'complete_profile';
      } else {
        // Users pending approval
        nextStep = 'pending_approval';
      }
    } else if (user.approval_status === 'approved') {
      // Approved users can authenticate
      nextStep = 'authenticate';
    }

    // Create response data
    const responseData = {
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isVerified: Boolean(user.is_verified),
        approvalStatus: user.approval_status || 'pending',
        role: user.user_type
      },
      methods,
      socialProviders,
      suggestions: methods,
      message,
      requiresVerification: !user.is_verified,
      requiresApproval: user.approval_status !== 'approved',
      nextStep
    };

    // Add OTP info for unverified users
    if (!user.is_verified) {
      responseData.otpSent = true;
      responseData.otpMessage = 'A verification code has been sent to your email address.';
    }

    return res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Auth detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect authentication methods'
    });
  }
});

// 2. Enhanced signup with OTP verification
router.post('/signup-enhanced', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').isLength({ min: 1 }),
  body('last_name').isLength({ min: 1 }),
  body('user_type').isIn(['project_owner', 'investor'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      email,
      password,
      first_name,
      last_name,
      user_type
    } = req.body;

    // Check if user already exists
    const existingUser = await getOne('SELECT email FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate user ID
    const userId = generateUserId();

    // Insert new user with essential Step 1 fields only
    const result = await executeQuery(
      `INSERT INTO users (
        id, email, password_hash, first_name, last_name, user_type,
        is_verified, is_active, approval_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, email, hashedPassword, first_name, last_name, user_type,
        false, true, 'pending'
      ]
    );

    if (!result.affectedRows) {
      throw new Error('Failed to create user account');
    }

    // Send OTP for email verification
    try {
      const otpResult = await otpService.generateAndSendOTP(userId, email, 'email_verification', `${first_name} ${last_name}`);
      console.log('OTP sent to:', email, 'Result:', otpResult);
    } catch (otpError) {
      console.error('OTP sending failed for', email, ':', otpError);
      // Don't fail the signup if OTP fails - user can request resend
    }

    return res.status(201).json({
      success: true,
      data: {
        userId,
        requiresVerification: true,
        otpSent: true,
        nextStep: 'email_verification'
      }
    });

  } catch (error) {
    console.error('Enhanced signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Signup failed. Please try again.'
    });
  }
});

// 3. Verify email with OTP
router.post('/verify-email', [
  body('email').isEmail().normalizeEmail(),
  body('otpCode').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email or OTP code format',
        details: errors.array()
      });
    }

    const { email, otpCode } = req.body;

    // Verify OTP
    const otpResult = await otpService.verifyOTP(email, otpCode, 'email_verification');

    if (!otpResult.isValid) {
      return res.status(400).json({
        success: false,
        error: otpResult.error || 'Invalid or expired verification code'
      });
    }

    // Mark user as verified
    await executeQuery(
      'UPDATE users SET is_verified = 1, email_verified_at = NOW() WHERE email = ?',
      [email]
    );

    // Get updated user
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        user: transformUserToEnhanced(user),
        nextStep: user.approval_status === 'approved' ? 'complete' : 'pending_approval'
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
});

// 4. Enhanced login
router.post('/login-enhanced', [
  body('email').isEmail().normalizeEmail(),
  body('loginMethod').optional().isIn(['password', 'otp'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid login data',
        details: errors.array()
      });
    }

    const { email, password, otpCode, loginMethod = 'password' } = req.body;

    // Get user
    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    console.log("User found:", user);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // OAuth conflict detection - check if user registered with social login
    if (loginMethod === 'password' && user.auth_method && user.auth_method !== 'password') {
      const provider = user.auth_method === 'google' ? 'Google' : 'LinkedIn';
      return res.status(400).json({
        success: false,
        error: `This email is registered with ${provider}. Please login with ${provider}.`,
        errorCode: 'OAUTH_CONFLICT',
        suggestedProvider: user.auth_method
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }

    let isAuthenticated = false;

    // Authenticate based on login method
    if (loginMethod === 'password') {
      if (!password) {
        return res.status(400).json({
          success: false,
          error: 'Password is required'
        });
      }

      if (!user.password_hash) {
        return res.status(400).json({
          success: false,
          error: 'Password login not available. Please use email verification code.'
        });
      }

      isAuthenticated = await bcrypt.compare(password, user.password_hash);
    } else if (loginMethod === 'otp') {
      if (!otpCode) {
        return res.status(400).json({
          success: false,
          error: 'Verification code is required'
        });
      }

      const otpResult = await otpService.verifyOTP(email, otpCode, 'login');
      console.log("otpResult:", otpResult);
      isAuthenticated = otpResult.success;

      if (!otpResult.success) {
        return res.status(401).json({
          success: false,
          error: otpResult.error || 'Invalid or expired login code'
        });
      }
    }

    if (!isAuthenticated) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Skip last login update since column doesn't exist in current schema
    // await executeQuery('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Check if user is verified
    if (!user.is_verified) {
      // Send OTP automatically for unverified users
      await otpService.generateAndSendOTP(user.id, email, 'email_verification');

      return res.json({
        success: true,
        data: {
          success: true,
          message: 'Email verification required. We have sent you a verification code.',
          user: transformUserToEnhanced(user),
          accessToken,
          refreshToken,
          requiresVerification: true,
          requiresApproval: user.approval_status !== 'approved',
          nextStep: 'email_verification',
          otpSent: true
        }
      });
    }

    // Check if investor has completed profile (Step 2)
    let profileCompleted = true;
    let nextStep = 'complete';

    if (user.user_type === 'investor' || user.role === 'investor') {
      // Check if essential investor fields are filled
      profileCompleted = !!(
        user.investment_range &&
        user.investment_categories &&
        (user.accredited_investor !== null && user.accredited_investor !== undefined)
      );

      if (!profileCompleted) {
        nextStep = 'complete_profile';
      } else if (user.approval_status !== 'approved') {
        nextStep = 'pending_approval';
      }
    } else if (user.user_type === 'project_owner' || user.role === 'project_owner') {
      // Project owners don't need Step 2, just check approval
      nextStep = user.approval_status !== 'approved' ? 'pending_approval' : 'complete';
    } else if (user.user_type === 'admin' || user.role === 'admin') {
      // Admin users go straight to complete
      nextStep = 'complete';
    }

    return res.json({
      success: true,
      data: {
        success: true,
        message: 'Login successful',
        user: transformUserToEnhanced(user),
        accessToken,
        refreshToken,
        requiresVerification: false,
        requiresApproval: user.approval_status !== 'approved',
        profileCompleted,
        nextStep
      }
    });

  } catch (error) {
    console.error('Enhanced login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed. Please try again.'
    });
  }
});

// 5. Request login OTP (passwordless)
router.post('/request-login-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await getOne('SELECT id, email, first_name FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email address'
      });
    }

    // Send login OTP
    await otpService.generateAndSendOTP(user.id, email, 'login');

    return res.json({
      success: true,
      data: {
        message: `Login code sent to ${email}`
      }
    });

  } catch (error) {
    console.error('Request login OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send login code'
    });
  }
});

// 6. Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail(),
  body('type').isIn(['email_verification', 'login'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: errors.array()
      });
    }

    const { email, type } = req.body;

    // Check if user exists
    const user = await getOne('SELECT id FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Send OTP
    await otpService.generateAndSendOTP(user.id, email, type);

    const message = type === 'email_verification'
      ? 'Verification code resent to your email'
      : 'Login code resent to your email';

    return res.json({
      success: true,
      data: { message }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification code'
    });
  }
});

// 7. Get enhanced user profile
router.get('/me-enhanced', verifyToken, async (req, res) => {
  try {
     const user = await  getOne(
      `SELECT id, email, first_name, last_name, user_type, location, phone,
              website_url, linkedin_url, bio, investment_range, investment_focus,
              investment_categories, accredited_investor, is_verified, approval_status, created_at
              FROM users WHERE id = ?`,
      [req.user.id]
    );

  // getOne('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: {
        user: user
      }
    });

  } catch (error) {
    console.error('Get enhanced profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// OAuth callback routes for provider redirects
// Helper function to get frontend URL based on environment
const getFrontendUrl = (req) => {
  // 1. Use environment variable if set
  if (process.env.FRONTEND_URL) {
    console.log('🔗 Using FRONTEND_URL from env:', process.env.FRONTEND_URL);
    return process.env.FRONTEND_URL;
  }

  // 2. Detect from environment
  if (process.env.NODE_ENV === 'production') {
    return 'http://13.200.209.191:8080';
  } else {
    return 'http://localhost:3002';
  }
};

// Helper function to get OAuth redirect URI based on environment
const getOAuthRedirectUri = (provider) => {
  const envKey = `${provider.toUpperCase()}_REDIRECT_URI`;
  const envUri = process.env[envKey];

  if (envUri) {
    console.log(`🔗 Using ${envKey} from env:`, envUri);
    return envUri;
  }

  // Fallback based on environment
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'http://13.200.209.191:8080'
    : 'http://localhost:3001';

  return `${baseUrl}/api/auth-enhanced/oauth/${provider}/callback`;
};

router.get('/oauth/google/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = getFrontendUrl(req);

    if (error) {
      // User denied access or other error
      return res.redirect(`${frontendUrl}/login?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    // Exchange code for tokens using environment-specific redirect URI
    const redirectUri = getOAuthRedirectUri('google');
    console.log('🔄 Google OAuth: Using redirect URI:', redirectUri);
    const userInfo = await exchangeGoogleCode(code, redirectUri);

    if (!userInfo) {
      return res.redirect(`${frontendUrl}/login?error=exchange_failed`);
    }

    // Check if user exists
    let user = await getOne('SELECT * FROM users WHERE email = ?', [userInfo.email]);
    let isNewSignup = false;

    if (!user) {
      // NEW USER SIGNUP - Create account with Google OAuth
      isNewSignup = true;
      const userId = generateUserId();

      await executeQuery(
        `INSERT INTO users (
          id, email, first_name, last_name, user_type,
          is_verified, is_active, approval_status, avatar_url, auth_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          userInfo.email,
          userInfo.firstName,
          userInfo.lastName,
          null, // User will choose type during profile completion
          true, // OAuth accounts are pre-verified
          true,
          'pending',
          userInfo.picture || null,
          'google'
        ]
      );

      user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
      console.log(`New Google OAuth signup created for user: ${user.email}`);
    } else {
      // EXISTING USER LOGIN - Allow login for Google OAuth users
      console.log(`Existing user logging in via Google OAuth: ${user.email} (${user.auth_method})`);

      // Only allow OAuth login if user originally signed up with OAuth or if they're the same method
      if (user.auth_method && user.auth_method !== 'google' && user.auth_method !== 'linkedin') {
        // User originally signed up with password - redirect to regular login
        const frontendUrl = getFrontendUrl(req);
        return res.redirect(`${frontendUrl}/login?error=use_password&email=${encodeURIComponent(user.email)}`);
      }

      // Valid OAuth login - continue with flow
      isNewSignup = false;
    }

    // Determine user flow based on their state
    // (frontendUrl already declared at the top of the function)

    // NEW USERS: Check if they need to select user type first
    if (!user.user_type) {
      console.log(`Google OAuth: New user needs to select user type: ${user.email}`);

      // Generate tokens for new users so they can access user type selection
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'select_user_type');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: null,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'google');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    // EXISTING USERS: Handle based on approval status
    const approvalStatus = user.approval_status || 'pending';
    const userRole = user.user_type;
    const isProfileComplete = checkProfileCompletion(user, userRole);

    if (approvalStatus === 'rejected') {
      console.log(`Google OAuth: Rejected user login: ${user.email}`);

      // Generate tokens for rejected users so they can access resubmission forms
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'rejected');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        role: user.user_type,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'google');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    if (approvalStatus === 'pending') {
      console.log(`Google OAuth: Pending user login: ${user.email}`);

      // Generate tokens for pending users so they can access their profile data
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'pending');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        role: user.user_type,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'google');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    if (approvalStatus === 'approved' && !isProfileComplete) {
      console.log(`Google OAuth: Approved user with incomplete profile: ${user.email}`);

      // Generate tokens for approved users with incomplete profiles
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'profile_incomplete');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        role: user.user_type,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'google');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    // User is approved and profile is complete - generate tokens and redirect to dashboard
    const { accessToken, refreshToken } = generateTokens(user);
    const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('refresh_token', refreshToken);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      role: user.user_type,
      approval_status: user.approval_status,
      is_verified: user.is_verified
    })));
    redirectUrl.searchParams.set('provider', 'google');
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    const frontendUrl = getFrontendUrl(req);
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

router.get('/oauth/linkedin/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    const frontendUrl = getFrontendUrl(req);

    if (error) {
      // User denied access or other error
      return res.redirect(`${frontendUrl}/login?error=${error}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    // Exchange code for tokens using environment-specific redirect URI
    const redirectUri = getOAuthRedirectUri('linkedin');
    console.log('🔄 LinkedIn OAuth: Using redirect URI:', redirectUri);
    const userInfo = await exchangeLinkedInCode(code, redirectUri);

    if (!userInfo) {
      return res.redirect(`${frontendUrl}/login?error=exchange_failed`);
    }

    // Check if user exists
    let user = await getOne('SELECT * FROM users WHERE email = ?', [userInfo.email]);
    let isNewSignup = false;

    if (!user) {
      // NEW USER SIGNUP - Create account with LinkedIn OAuth
      isNewSignup = true;
      const userId = generateUserId();

      await executeQuery(
        `INSERT INTO users (
          id, email, first_name, last_name, user_type,
          is_verified, is_active, approval_status, avatar_url, auth_method
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          userInfo.email,
          userInfo.firstName,
          userInfo.lastName,
          null, // User will choose type during profile completion
          true, // OAuth accounts are pre-verified
          true,
          'pending',
          userInfo.picture || null,
          'linkedin'
        ]
      );

      user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
      console.log(`New LinkedIn OAuth signup created for user: ${user.email}`);
    } else {
      // EXISTING USER LOGIN - Allow login for LinkedIn OAuth users
      console.log(`Existing user logging in via LinkedIn OAuth: ${user.email} (${user.auth_method})`);

      // Only allow OAuth login if user originally signed up with OAuth or if they're the same method
      if (user.auth_method && user.auth_method !== 'linkedin' && user.auth_method !== 'google') {
        // User originally signed up with password - redirect to regular login
        const frontendUrl = getFrontendUrl(req);
        return res.redirect(`${frontendUrl}/login?error=use_password&email=${encodeURIComponent(user.email)}`);
      }

      // Valid OAuth login - continue with flow
      isNewSignup = false;
    }

    // Determine user flow based on their state
    // (frontendUrl already declared at the top of the function)

    // NEW USERS: Check if they need to select user type first
    if (!user.user_type) {
      console.log(`LinkedIn OAuth: New user needs to select user type: ${user.email}`);

      // Generate tokens for new users so they can access user type selection
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'select_user_type');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: null,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'linkedin');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    // EXISTING USERS: Handle based on approval status
    const approvalStatus = user.approval_status || 'pending';
    const userRole = user.user_type;
    const isProfileComplete = checkProfileCompletion(user, userRole);

    if (approvalStatus === 'rejected') {
      console.log(`LinkedIn OAuth: Rejected user login: ${user.email}`);

      // Generate tokens for rejected users so they can access resubmission forms
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'rejected');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        role: user.user_type,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'linkedin');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    if (approvalStatus === 'pending') {
      console.log(`LinkedIn OAuth: Pending user login: ${user.email}`);

      // Generate tokens for pending users so they can access their profile data
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'pending');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        role: user.user_type,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'linkedin');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    if (approvalStatus === 'approved' && !isProfileComplete) {
      console.log(`LinkedIn OAuth: Approved user with incomplete profile: ${user.email}`);

      // Generate tokens for approved users with incomplete profiles
      const { accessToken, refreshToken } = generateTokens(user);

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('status', 'profile_incomplete');
      redirectUrl.searchParams.set('access_token', accessToken);
      redirectUrl.searchParams.set('refresh_token', refreshToken);
      redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        user_type: user.user_type,
        role: user.user_type,
        approval_status: user.approval_status
      })));
      redirectUrl.searchParams.set('provider', 'linkedin');
      redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());
      return res.redirect(redirectUrl.toString());
    }

    // User is approved and profile is complete - generate tokens and redirect to dashboard
    const { accessToken, refreshToken } = generateTokens(user);
    const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
    redirectUrl.searchParams.set('access_token', accessToken);
    redirectUrl.searchParams.set('refresh_token', refreshToken);
    redirectUrl.searchParams.set('user', encodeURIComponent(JSON.stringify({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type,
      role: user.user_type,
      approval_status: user.approval_status,
      is_verified: user.is_verified
    })));
    redirectUrl.searchParams.set('provider', 'linkedin');
    redirectUrl.searchParams.set('status', 'success');
    redirectUrl.searchParams.set('isNewSignup', isNewSignup.toString());

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    const frontendUrl = getFrontendUrl(req);
    return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
  }
});

// OAuth endpoints
router.get('/oauth/url/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { redirect_uri } = req.query;

    if (!['google', 'linkedin'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported OAuth provider',
        errorCode: 'INVALID_PROVIDER'
      });
    }

    // Validate environment variables based on provider
    if (provider === 'google') {
      if (!process.env.GOOGLE_CLIENT_ID) {
        console.error('OAuth Configuration Error: GOOGLE_CLIENT_ID is not set');
        return res.status(500).json({
          success: false,
          error: 'Google OAuth is not configured. Please contact administrator.',
          errorCode: 'GOOGLE_CONFIG_MISSING'
        });
      }

      if (!process.env.GOOGLE_REDIRECT_URI && !redirect_uri) {
        console.error('OAuth Configuration Error: GOOGLE_REDIRECT_URI is not set and no redirect_uri provided');
        return res.status(500).json({
          success: false,
          error: 'Google OAuth redirect URI is not configured.',
          errorCode: 'GOOGLE_REDIRECT_MISSING'
        });
      }
    } else if (provider === 'linkedin') {
      if (!process.env.LINKEDIN_CLIENT_ID) {
        console.error('OAuth Configuration Error: LINKEDIN_CLIENT_ID is not set');
        return res.status(500).json({
          success: false,
          error: 'LinkedIn OAuth is not configured. Please contact administrator.',
          errorCode: 'LINKEDIN_CONFIG_MISSING'
        });
      }

      if (!process.env.LINKEDIN_REDIRECT_URI && !redirect_uri) {
        console.error('OAuth Configuration Error: LINKEDIN_REDIRECT_URI is not set and no redirect_uri provided');
        return res.status(500).json({
          success: false,
          error: 'LinkedIn OAuth redirect URI is not configured.',
          errorCode: 'LINKEDIN_REDIRECT_MISSING'
        });
      }
    }

    const state = Math.random().toString(36).substring(2);
    let authUrl;

    if (provider === 'google') {
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set('redirect_uri', redirect_uri || process.env.GOOGLE_REDIRECT_URI);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('state', state);
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      authUrl = googleAuthUrl.toString();
      console.log(`Google OAuth URL generated for redirect: ${redirect_uri || process.env.GOOGLE_REDIRECT_URI}`);
    } else if (provider === 'linkedin') {
      const linkedinAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
      linkedinAuthUrl.searchParams.set('client_id', process.env.LINKEDIN_CLIENT_ID);
      linkedinAuthUrl.searchParams.set('redirect_uri', redirect_uri || process.env.LINKEDIN_REDIRECT_URI);
      linkedinAuthUrl.searchParams.set('response_type', 'code');
      linkedinAuthUrl.searchParams.set('scope', 'openid profile email');
      linkedinAuthUrl.searchParams.set('state', state);

      authUrl = linkedinAuthUrl.toString();
      console.log(`LinkedIn OAuth URL generated for redirect: ${redirect_uri || process.env.LINKEDIN_REDIRECT_URI}`);
    }

    return res.json({
      success: true,
      data: {
        authUrl,
        state,
        provider
      }
    });

  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate OAuth URL. Please try again.',
      errorCode: 'OAUTH_URL_GENERATION_FAILED'
    });
  }
});

router.post('/oauth/exchange/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, redirect_uri } = req.body;

    if (!['google', 'linkedin'].includes(provider)) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported OAuth provider'
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    let userInfo;

    if (provider === 'google') {
      // Use the enhanced callback route for Google OAuth consistency
      const enhancedRedirectUri = `http://localhost:3001/api/auth-enhanced/oauth/google/callback`;
      userInfo = await exchangeGoogleCode(code, enhancedRedirectUri);
    } else if (provider === 'linkedin') {
      userInfo = await exchangeLinkedInCode(code, redirect_uri);
    }

    if (!userInfo) {
      return res.status(400).json({
        success: false,
        error: 'Failed to exchange OAuth code'
      });
    }

    // Check if user already exists
    let user = await getOne('SELECT * FROM users WHERE email = ?', [userInfo.email]);

    if (!user) {
      // Create new user from OAuth info
      const userId = generateUserId();

      await executeQuery(
        `INSERT INTO users (
          id, email, first_name, last_name, user_type,
          is_verified, is_active, approval_status, avatar_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          userInfo.email,
          userInfo.firstName,
          userInfo.lastName,
          null, // Let user choose during form completion
          true, // OAuth accounts are pre-verified
          true,
          'pending',
          userInfo.picture || null
        ]
      );

      user = await getOne('SELECT * FROM users WHERE id = ?', [userId]);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    return res.json({
      success: true,
      data: {
        success: true,
        message: 'OAuth authentication successful',
        user: transformUserToEnhanced(user),
        accessToken,
        refreshToken,
        requiresVerification: false, // OAuth accounts are pre-verified
        requiresApproval: user.approval_status !== 'approved',
        isNewUser: !user.created_at || (new Date() - new Date(user.created_at)) < 5000,
        nextStep: user.approval_status === 'approved' ? 'complete' : 'pending_approval'
      }
    });

  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'OAuth authentication failed'
    });
  }
});

// OAuth Helper Functions
async function exchangeGoogleCode(code, redirectUri) {
  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profile = profileResponse.data;

    return {
      email: profile.email,
      firstName: profile.given_name || '',
      lastName: profile.family_name || '',
      picture: profile.picture || null,
      providerId: profile.id,
      provider: 'google'
    };
  } catch (error) {
    console.error('Google OAuth exchange error:', error);
    return null;
  }
}

// async function exchangeLinkedInCode(code, redirectUri) {
//   try {
//     // Exchange code for access token
//     const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
//       grant_type: 'authorization_code',
//       code,
//       redirect_uri: redirectUri || process.env.LINKEDIN_REDIRECT_URI,
//       client_id: process.env.LINKEDIN_CLIENT_ID,
//       client_secret: process.env.LINKEDIN_CLIENT_SECRET,
//     }, {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//     });

//     const { access_token } = tokenResponse.data;

//     // Get user profile and email using LinkedIn API v2 - new format
//     const profileResponse = await axios.get('https://api.linkedin.com/v2/people/(id~)', {
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//       },
//     });

//     // Get user email using current LinkedIn API
//     const emailResponse = await axios.get('https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(primary,type,handle~))', {
//       headers: {
//         Authorization: `Bearer ${access_token}`,
//       },
//     });

//     const profile = profileResponse.data;
//     const emailElement = emailResponse.data.elements?.find(element => element.type === 'EMAIL');
//     const email = emailElement?.['handle~']?.emailAddress;

//     if (!email) {
//       throw new Error('No email found in LinkedIn profile');
//     }

//     return {
//       email: email,
//       firstName: profile.localizedFirstName || profile.firstName?.localized?.en_US || '',
//       lastName: profile.localizedLastName || profile.lastName?.localized?.en_US || '',
//       picture: null, // LinkedIn profile picture requires additional API call
//       providerId: profile.id,
//       provider: 'linkedin'
//     };
//   } catch (error) {
//     console.error('LinkedIn OAuth exchange error:', error);
//     return null;
//   }
// }


async function exchangeLinkedInCode(code, redirectUri) {
  try {
    // 1. Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri || process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // 2. Get user info using OpenID Connect userinfo endpoint (modern LinkedIn API)
    const userInfoResponse = await axios.get("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const userInfo = userInfoResponse.data;

    if (!userInfo.email) {
      throw new Error("No email found in LinkedIn profile");
    }

    return {
      email: userInfo.email,
      firstName: userInfo.given_name || "",
      lastName: userInfo.family_name || "",
      picture: userInfo.picture || null,
      providerId: userInfo.sub,
      provider: "linkedin",
    };
  } catch (error) {
    console.error("LinkedIn OAuth exchange error:", error.response?.data || error.message);
    return null;
  }
}

// Resubmit application for rejected users (essential fields only)
router.post('/resubmit-application', [
  body('email').isEmail().normalizeEmail(),
  body('first_name').notEmpty().trim(),
  body('last_name').optional().trim(),
  body('user_type').isIn(['project_owner', 'investor']),
  body('location').optional().trim(),
  body('phone').optional().trim(),
  body('website_url').optional().isURL(),
  body('linkedin_url').optional().isURL(),
  body('bio').optional().trim(),
  body('investment_categories').optional().isArray(),
  body('accredited_investor').optional().isBoolean(),
  // Investor specific fields
  body('investment_focus').optional().trim(),
  body('investment_range').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid application data',
        details: errors.array()
      });
    }

    const {
      email,
      first_name,
      last_name,
      user_type,
      location,
      phone,
      website_url,
      linkedin_url,
      bio,
      investment_focus,
      investment_range,
      investment_categories,
      accredited_investor
    } = req.body;

    console.log('Resubmit application request:', { email, user_type });

    // Get existing user
    const existingUser = await getOne('SELECT * FROM users WHERE email = ?', [email]);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user is in rejected status
    if (existingUser.approval_status !== 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Only rejected applications can be resubmitted'
      });
    }

    console.log('User found for resubmission:', { id: existingUser.id, current_status: existingUser.approval_status });

    // Prepare update data (essential fields only)
    const updateData = {
      first_name,
      last_name,
      user_type,
      approval_status: 'pending', // Reset to pending for admin review
      location: location || null,
      phone: phone || null,
      website_url: website_url || null,
      linkedin_url: linkedin_url || null,
      bio: bio || null,
      investment_focus: investment_focus || null,
      investment_range: investment_range || null,
      investment_categories: investment_categories ? JSON.stringify(investment_categories) : null,
      accredited_investor: accredited_investor || false,
    };

    // Build dynamic UPDATE query
    const updateFields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    const updateValues = updateFields.map(key => updateData[key]);
    const updateQuery = `UPDATE users SET ${updateFields.map(field => `${field} = ?`).join(', ')} WHERE id = ?`;
    updateValues.push(existingUser.id);

    console.log('Updating user with query:', updateQuery);
    console.log('Update values:', updateValues);

    // Update user profile
    await executeQuery(updateQuery, updateValues);

    // Get updated user
    const updatedUser = await getOne('SELECT * FROM users WHERE id = ?', [existingUser.id]);

    console.log('Application resubmitted successfully:', {
      userId: updatedUser.id,
      new_status: updatedUser.approval_status
    });

    return res.json({
      success: true,
      data: {
        userId: updatedUser.id,
        message: 'Application resubmitted successfully. It will be reviewed by our admin team.',
        nextStep: 'pending_approval'
      }
    });

  } catch (error) {
    console.error('Resubmit application error:', error);
    res.status(500).json({
      success: false,
      error: 'Application resubmission failed. Please try again.'
    });
  }
});

// 9. Forgot Password - Request OTP
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await getOne('SELECT id, email, first_name FROM users WHERE email = ?', [email]);

    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, you will receive a password reset code.'
      });
    }

    // Generate and send OTP for password reset
    await otpService.generateAndSendOTP(user.id, email, 'password_reset');

    return res.json({
      success: true,
      message: 'Password reset code sent to your email',
      data: {
        email,
        otpSent: true
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send password reset code. Please try again.'
    });
  }
});

// 10. Reset Password with OTP
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('otpCode').isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: errors.array()
      });
    }

    const { email, otpCode, newPassword } = req.body;

    // Verify OTP
    const otpResult = await otpService.verifyOTP(email, otpCode, 'password_reset');

    if (!otpResult.success) {
      return res.status(401).json({
        success: false,
        error: otpResult.error || 'Invalid or expired reset code'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await executeQuery(
      'UPDATE users SET password_hash = ? WHERE email = ?',
      [hashedPassword, email]
    );

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password. Please try again.'
    });
  }
});

// 11. Change Password (for authenticated users)
router.post('/change-password', verifyToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password
    const user = await getOne('SELECT id, password_hash FROM users WHERE id = ?', [userId]);

    if (!user || !user.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'Password change not available for this account'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await executeQuery(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password. Please try again.'
    });
  }
});

// Helper function to check if user profile is complete
function checkProfileCompletion(user, userRole) {
  // Basic required fields for all users
  const hasBasicInfo = user.first_name && user.last_name && user.email;

  if (!hasBasicInfo) {
    return false;
  }

  // For investors, check additional required fields
  if (userRole === 'investor') {
    return !!(
      user.company &&
      user.location &&
      user.preferred_category &&
      user.investment_range &&
      user.portfolio_size
    );
  }

  // For project owners, check required fields
  if (userRole === 'project_owner') {
    return !!(
      user.company &&
      user.location &&
      user.phone
    );
  }

  // For admin and other roles, basic info is sufficient
  return true;
}

// User type selection for new OAuth users
router.post('/select-user-type', verifyToken, async (req, res) => {
  try {
    const { user_type } = req.body;

    // Validate user_type
    if (!user_type || !['investor', 'project_owner'].includes(user_type)) {
      return res.status(400).json({
        success: false,
        error: 'Valid user type is required',
        errorCode: 'INVALID_USER_TYPE'
      });
    }

    // Get current user
    const user = await getOne(
      'SELECT id, email, user_type, auth_method FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    // Verify user doesn't already have a user_type
    if (user.user_type) {
      return res.status(400).json({
        success: false,
        error: 'User type already set',
        errorCode: 'USER_TYPE_ALREADY_SET',
        currentUserType: user.user_type
      });
    }

    // Update user type
    await executeQuery(
      'UPDATE users SET user_type = ? WHERE id = ?',
      [user_type, req.user.id]
    );

    console.log(`OAuth user ${user.email} selected user type: ${user_type}`);

    // Get updated user data
    const updatedUser = await getOne(
      'SELECT id, email, first_name, last_name, user_type, approval_status, is_verified FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      message: 'User type selected successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        role: updatedUser.user_type,
        approval_status: updatedUser.approval_status,
        is_verified: updatedUser.is_verified
      },
      nextStep: user_type === 'investor' ? 'investor_profile_completion' : 'project_owner_profile_completion'
    });

  } catch (error) {
    console.error('User type selection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to select user type',
      errorCode: 'SERVER_ERROR'
    });
  }
});

module.exports = router;