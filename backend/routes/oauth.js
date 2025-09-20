const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const oauthService = require('../services/oauthService');

const router = express.Router();

// Generate tokens for OAuth users
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

// Get OAuth authorization URL
router.get('/url/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { redirect_uri } = req.query;

    if (!['google', 'linkedin'].includes(provider)) {
      return res.status(400).json({ error: 'Unsupported OAuth provider' });
    }

    // Generate state token for security
    const state = await oauthService.generateStateToken(provider, redirect_uri);
    console.log('Generated state token:', state);
    // Get authorization URL
    const authUrl = oauthService.getAuthUrl(provider, state, redirect_uri);

    res.json({
      success: true,
      authUrl,
      state,
      provider
    });

  } catch (error) {
    console.error('OAuth URL generation error:', error);
    res.status(500).json({ error: 'Failed to generate OAuth URL' });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent'
  })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/failure' }),
  async (req, res) => {
    try {
      const { state } = req.query;

      // Verify state token if provided
      if (state) {
        const stateVerification = await oauthService.verifyStateToken(state, 'google');
        if (!stateVerification.valid) {
          return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=invalid_state`);
        }
      }

      const oauthResult = req.user;

      if (!oauthResult.success) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_failed`);
      }

      const user = oauthResult.user;

      // Check user status
      if (!user.is_verified) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/verify-email?email=${encodeURIComponent(user.email)}`);
      }

      if (user.approval_status === 'rejected') {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/rejected`);
      }

      if (user.approval_status === 'pending') {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/pending-approval`);
      }

      // Generate tokens
      const tokens = generateTokens(user);

      // Check if this is a signup flow by looking at the profile completion step
      const isSignupFlow = user.profile_completion_step === 'oauth_signup';
      const redirectPath = isSignupFlow ? '/auth/oauth-callback' : '/auth/callback';

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}${redirectPath}?` +
        `access_token=${tokens.accessToken}&` +
        `refresh_token=${tokens.refreshToken}&` +
        `user=${encodeURIComponent(JSON.stringify({
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.user_type,
          company: user.company,
          location: user.location,
          is_verified: user.is_verified,
          approval_status: user.approval_status,
          avatar_url: user.avatar_url,
          profile_completion_step: user.profile_completion_step
        }))}`;

      res.redirect(redirectUrl);

    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=callback_failed`);
    }
  }
);

// Manual OAuth token exchange (for frontend-initiated flows)
router.post('/exchange/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, state, redirect_uri } = req.body;

    if (!['google', 'linkedin'].includes(provider)) {
      return res.status(400).json({ error: 'Unsupported OAuth provider' });
    }

    // Verify state token
    if (state) {
      const stateVerification = await oauthService.verifyStateToken(state, provider);
      if (!stateVerification.valid) {
        return res.status(400).json({
          error: 'Invalid state token',
          errorCode: 'INVALID_STATE'
        });
      }
    }

    // Exchange code for tokens (implementation depends on provider)
    if (provider === 'google') {
      const tokenResult = await exchangeGoogleCode(code, redirect_uri);

      if (!tokenResult.success) {
        return res.status(400).json({
          error: tokenResult.error || 'Token exchange failed',
          errorCode: 'TOKEN_EXCHANGE_FAILED'
        });
      }

      const oauthResult = tokenResult.user;
      const user = oauthResult.user;

      // Check user status
      if (!user.is_verified) {
        return res.status(403).json({
          error: 'Email not verified',
          errorCode: 'EMAIL_NOT_VERIFIED',
          requiresVerification: true
        });
      }

      if (user.approval_status === 'rejected') {
        return res.status(403).json({
          error: 'Account has been rejected',
          errorCode: 'ACCOUNT_REJECTED'
        });
      }

      if (user.approval_status === 'pending') {
        return res.status(403).json({
          error: 'Account pending approval',
          errorCode: 'ACCOUNT_PENDING'
        });
      }

      // Generate tokens
      const tokens = generateTokens(user);

      res.json({
        success: true,
        message: 'OAuth login successful',
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
          avatar_url: user.avatar_url
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser: oauthResult.isNewUser
      });
    } else if (provider === 'linkedin') {
      const tokenResult = await exchangeLinkedInCode(code, redirect_uri);

      if (!tokenResult.success) {
        return res.status(400).json({
          error: tokenResult.error || 'LinkedIn token exchange failed',
          errorCode: 'TOKEN_EXCHANGE_FAILED'
        });
      }

      const oauthResult = tokenResult.user;
      const user = oauthResult.user;

      // Check user status
      if (!user.is_verified) {
        return res.status(403).json({
          error: 'Email not verified',
          errorCode: 'EMAIL_NOT_VERIFIED',
          requiresVerification: true
        });
      }

      if (user.approval_status === 'rejected') {
        return res.status(403).json({
          error: 'Account has been rejected',
          errorCode: 'ACCOUNT_REJECTED'
        });
      }

      if (user.approval_status === 'pending') {
        return res.status(403).json({
          error: 'Account pending approval',
          errorCode: 'ACCOUNT_PENDING'
        });
      }

      // Generate tokens
      const tokens = generateTokens(user);

      res.json({
        success: true,
        message: 'LinkedIn OAuth login successful',
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
          avatar_url: user.avatar_url
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        isNewUser: oauthResult.isNewUser
      });
    }

  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({ error: 'Token exchange failed' });
  }
});

// Helper function to exchange Google authorization code for tokens
async function exchangeGoogleCode(code, redirectUri) {
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri || process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'Token exchange failed');
    }

    // Get user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    // Convert to passport-like profile format
    const passportProfile = {
      id: profile.id,
      emails: [{ value: profile.email }],
      name: {
        givenName: profile.given_name,
        familyName: profile.family_name
      },
      photos: [{ value: profile.picture }]
    };

    // Handle authentication using existing service
    const result = await oauthService.handleGoogleAuth(
      passportProfile,
      tokenData.access_token,
      tokenData.refresh_token
    );

    return {
      success: true,
      user: result
    };

  } catch (error) {
    console.error('Google code exchange error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Helper function to exchange LinkedIn authorization code for tokens
async function exchangeLinkedInCode(code, redirectUri) {
  try {
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: redirectUri || process.env.LINKEDIN_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || 'LinkedIn token exchange failed');
    }

    // Get user profile using v2 API
    const profileResponse = await fetch('https://api.linkedin.com/v2/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profile = await profileResponse.json();

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch LinkedIn user profile');
    }

    // Get email address separately
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const emailData = await emailResponse.json();
    const email = emailData.elements && emailData.elements[0] && emailData.elements[0]['handle~']
      ? emailData.elements[0]['handle~'].emailAddress
      : null;

    if (!email) {
      throw new Error('No email found in LinkedIn profile');
    }

    // Convert to passport-like profile format
    const passportProfile = {
      id: profile.id,
      emails: [{ value: email }],
      name: {
        givenName: profile.firstName && profile.firstName.localized
          ? Object.values(profile.firstName.localized)[0]
          : '',
        familyName: profile.lastName && profile.lastName.localized
          ? Object.values(profile.lastName.localized)[0]
          : ''
      },
      photos: profile.profilePicture && profile.profilePicture['displayImage~'] && profile.profilePicture['displayImage~'].elements
        ? [{ value: profile.profilePicture['displayImage~'].elements[0].identifiers[0].identifier }]
        : []
    };

    // Handle authentication using existing service
    const result = await oauthService.handleLinkedInAuth(
      passportProfile,
      tokenData.access_token,
      tokenData.refresh_token
    );

    return {
      success: true,
      user: result
    };

  } catch (error) {
    console.error('LinkedIn code exchange error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Link social account to existing user
router.post('/link/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const { email, code, state, redirect_uri } = req.body;

    if (!['google', 'linkedin'].includes(provider)) {
      return res.status(400).json({ error: 'Unsupported OAuth provider' });
    }

    // Verify state token
    if (state) {
      const stateVerification = await oauthService.verifyStateToken(state, provider);
      if (!stateVerification.valid) {
        return res.status(400).json({
          error: 'Invalid state token',
          errorCode: 'INVALID_STATE'
        });
      }
    }

    // Check if linking is possible
    const linkCheck = await authDetectionService.canLinkSocialAccount(email, provider, null);
    if (!linkCheck.canLink) {
      return res.status(400).json({
        error: linkCheck.message,
        errorCode: linkCheck.reason
      });
    }

    // Exchange code and link account
    if (provider === 'google') {
      const tokenResult = await exchangeGoogleCode(code, redirect_uri);

      if (!tokenResult.success) {
        return res.status(400).json({
          error: tokenResult.error || 'Token exchange failed',
          errorCode: 'TOKEN_EXCHANGE_FAILED'
        });
      }

      res.json({
        success: true,
        message: `${provider} account linked successfully`,
        linkedProvider: provider
      });
    }

  } catch (error) {
    console.error('OAuth link error:', error);
    res.status(500).json({ error: 'Failed to link social account' });
  }
});

// OAuth error handler
router.get('/failure', (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/auth/error?error=oauth_cancelled`);
});

module.exports = router;