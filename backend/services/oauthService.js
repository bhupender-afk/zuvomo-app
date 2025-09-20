const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { getOne, executeQuery } = require('../config/database');
const authDetectionService = require('./authDetectionService');

class OAuthService {
  constructor() {
    this.initializeStrategies();
  }

  initializeStrategies() {
    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI || "/api/auth-enhanced/oauth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const result = await this.handleGoogleAuth(profile, accessToken, refreshToken);
          return done(null, result);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error, null);
        }
      }));
    }

    // Passport session setup (minimal, since we use JWT)
    passport.serializeUser((user, done) => {
      done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await getOne('SELECT * FROM users WHERE id = ?', [id]);
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    });
  }

  // Handle Google authentication
  async handleGoogleAuth(profile, accessToken, refreshToken) {
    try {
      const googleId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
      const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      if (!email) {
        throw new Error('No email found in Google profile');
      }

      // Check if user exists with this email
      const existingUser = await getOne(
        'SELECT id, is_verified, approval_status FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        // User exists - check if Google auth method is already linked
        const googleAuth = await getOne(
          'SELECT id FROM user_auth_methods WHERE user_id = ? AND auth_method = "google" AND provider_id = ?',
          [existingUser.id, googleId]
        );

        if (!googleAuth) {
          // Link Google account to existing user
          await authDetectionService.addAuthMethod(existingUser.id, 'google', {
            providerId: googleId,
            providerEmail: email,
            additionalData: {
              accessToken,
              refreshToken,
              profile: {
                firstName,
                lastName,
                avatar
              }
            }
          });
        }

        // Update user avatar if not set
        if (avatar && !existingUser.avatar_url) {
          await executeQuery(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatar, existingUser.id]
          );
        }

        // Get full user data
        const fullUser = await getOne(
          'SELECT * FROM users WHERE id = ?',
          [existingUser.id]
        );

        return {
          success: true,
          user: fullUser,
          isNewUser: false,
          authMethod: 'google'
        };
      } else {
        // Create new user with Google auth
        const userId = 'USR' + Date.now() + Math.random().toString(36).substring(2, 7);

        await executeQuery(
          `INSERT INTO users (
            id, email, first_name, last_name, user_type,
            is_verified, is_active, approval_status, profile_completion_step,
            avatar_url, social_login_id, password_hash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, email, firstName, lastName, 'investor', // Default to investor
            true, // Google accounts are pre-verified
            true, 'pending', 'oauth_signup', // Needs profile completion for signup flow
            avatar, googleId, null // No password for social-only accounts
          ]
        );

        // Add Google authentication method
        await authDetectionService.addAuthMethod(userId, 'google', {
          providerId: googleId,
          providerEmail: email,
          additionalData: {
            accessToken,
            refreshToken,
            profile: {
              firstName,
              lastName,
              avatar
            }
          }
        });

        // Set Google as primary auth method
        await authDetectionService.setPrimaryAuthMethod(userId, 'google', googleId);

        // Get created user
        const newUser = await getOne(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );

        return {
          success: true,
          user: newUser,
          isNewUser: true,
          authMethod: 'google'
        };
      }
    } catch (error) {
      console.error('Error handling Google auth:', error);
      throw error;
    }
  }

  // Generate state token for OAuth flow
  async generateStateToken(provider, redirectUrl = null) {
    try {
      const stateToken = 'state_' + Date.now() + '_' + Math.random().toString(36).substring(2, 17);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await executeQuery(
        'INSERT INTO oauth_state_tokens (state_token, provider, redirect_url, expires_at) VALUES (?, ?, ?, ?)',
        [stateToken, provider, redirectUrl, expiresAt]
      );

      return stateToken;
    } catch (error) {
      console.error('Error generating state token:', error);
      throw error;
    }
  }

  // Verify state token
  async verifyStateToken(stateToken, provider) {
    try {
      const token = await getOne(
        'SELECT * FROM oauth_state_tokens WHERE state_token = ? AND provider = ? AND expires_at > NOW() AND is_used = FALSE',
        [stateToken, provider]
      );

      if (!token) {
        return { valid: false, error: 'Invalid or expired state token' };
      }

      // Mark token as used
      await executeQuery(
        'UPDATE oauth_state_tokens SET is_used = TRUE, used_at = NOW() WHERE id = ?',
        [token.id]
      );

      return {
        valid: true,
        redirectUrl: token.redirect_url
      };
    } catch (error) {
      console.error('Error verifying state token:', error);
      return { valid: false, error: 'State token verification failed' };
    }
  }

  // Handle LinkedIn authentication
  async handleLinkedInAuth(profile, accessToken, refreshToken) {
    try {
      const linkedinId = profile.id;
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const firstName = profile.name && profile.name.givenName ? profile.name.givenName : '';
      const lastName = profile.name && profile.name.familyName ? profile.name.familyName : '';
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      if (!email) {
        throw new Error('No email found in LinkedIn profile');
      }

      // Check if user exists with this email
      const existingUser = await getOne(
        'SELECT id, is_verified, approval_status FROM users WHERE email = ?',
        [email]
      );

      if (existingUser) {
        // User exists - check if LinkedIn auth method is already linked
        const linkedinAuth = await getOne(
          'SELECT id FROM user_auth_methods WHERE user_id = ? AND auth_method = "linkedin" AND provider_id = ?',
          [existingUser.id, linkedinId]
        );

        if (!linkedinAuth) {
          // Link LinkedIn account to existing user
          await authDetectionService.addAuthMethod(existingUser.id, 'linkedin', {
            providerId: linkedinId,
            providerEmail: email,
            additionalData: {
              accessToken,
              refreshToken,
              profile: {
                firstName,
                lastName,
                avatar
              }
            }
          });
        }

        // Update user avatar if not set
        if (avatar && !existingUser.avatar_url) {
          await executeQuery(
            'UPDATE users SET avatar_url = ? WHERE id = ?',
            [avatar, existingUser.id]
          );
        }

        // Get full user data
        const fullUser = await getOne(
          'SELECT * FROM users WHERE id = ?',
          [existingUser.id]
        );

        return {
          success: true,
          user: fullUser,
          isNewUser: false,
          authMethod: 'linkedin'
        };
      } else {
        // Create new user with LinkedIn auth
        const userId = 'USR' + Date.now() + Math.random().toString(36).substring(2, 7);

        await executeQuery(
          `INSERT INTO users (
            id, email, first_name, last_name, user_type,
            is_verified, is_active, approval_status, profile_completion_step,
            avatar_url, social_login_id, password_hash
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId, email, firstName, lastName, 'investor', // Default to investor
            true, // LinkedIn accounts are pre-verified
            true, 'pending', 'oauth_signup', // Needs profile completion for signup flow
            avatar, linkedinId, null // No password for social-only accounts
          ]
        );

        // Add LinkedIn authentication method
        await authDetectionService.addAuthMethod(userId, 'linkedin', {
          providerId: linkedinId,
          providerEmail: email,
          additionalData: {
            accessToken,
            refreshToken,
            profile: {
              firstName,
              lastName,
              avatar
            }
          }
        });

        // Set LinkedIn as primary auth method
        await authDetectionService.setPrimaryAuthMethod(userId, 'linkedin', linkedinId);

        // Get created user
        const newUser = await getOne(
          'SELECT * FROM users WHERE id = ?',
          [userId]
        );

        return {
          success: true,
          user: newUser,
          isNewUser: true,
          authMethod: 'linkedin'
        };
      }
    } catch (error) {
      console.error('Error handling LinkedIn auth:', error);
      throw error;
    }
  }

  // Get OAuth authorization URL
  getAuthUrl(provider, state, redirectUri = null) {
    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/auth',
      linkedin: 'https://www.linkedin.com/oauth/v2/authorization'
    };

    const scopes = {
      google: 'openid email profile',
      linkedin: 'liteprofile emailaddress w_member_social',
    };

    const clientIds = {
      google: process.env.GOOGLE_CLIENT_ID,
      linkedin: process.env.LINKEDIN_CLIENT_ID
    };

    const redirectUris = {
      google: process.env.GOOGLE_REDIRECT_URI,
      linkedin: process.env.LINKEDIN_REDIRECT_URI
    };

    if (!baseUrls[provider] || !clientIds[provider]) {
      throw new Error(`OAuth provider ${provider} not configured`);
    }

    const params = new URLSearchParams({
      client_id: clientIds[provider],
      redirect_uri: redirectUri || redirectUris[provider],
      scope: scopes[provider],
      response_type: 'code',
      state: state,
      access_type: 'offline', // For Google to get refresh token
      prompt: 'consent' // Force consent screen to ensure refresh token
    });

    return `${baseUrls[provider]}?${params.toString()}`;
  }

  // Clean up expired state tokens (maintenance function)
  async cleanupExpiredTokens() {
    try {
      const result = await executeQuery(
        'DELETE FROM oauth_state_tokens WHERE expires_at < NOW() OR (is_used = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR))'
      );

      console.log(`Cleaned up ${result.affectedRows} expired OAuth state tokens`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up OAuth tokens:', error);
      return 0;
    }
  }
}

// Create and export singleton instance
const oauthService = new OAuthService();

module.exports = oauthService;