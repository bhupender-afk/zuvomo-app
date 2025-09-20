const { getOne, executeQuery } = require('../config/database');

class AuthDetectionService {

  // Detect available authentication methods for an email
  async detectAuthMethods(email) {
    try {
      // First, check if user exists
      const user = await getOne(
        'SELECT id, email, first_name, last_name, password_hash, is_verified, approval_status FROM users WHERE email = ?',
        [email]
      );

      if (!user) {
        return {
          exists: false,
          methods: [],
          suggestions: ['signup'],
          message: 'No account found with this email. You can create a new account.'
        };
      }

      // Get all authentication methods for this user
      const authMethods = await executeQuery(
        'SELECT auth_method, provider_id, is_primary, is_active FROM user_auth_methods WHERE user_id = ? AND is_active = TRUE',
        [user.id]
      );

      const availableMethods = [];
      const socialProviders = [];

      // Process authentication methods
      authMethods.forEach(method => {
        if (method.auth_method === 'password' && user.password_hash) {
          availableMethods.push('password');
        } else if (['google', 'linkedin', 'facebook', 'github'].includes(method.auth_method)) {
          availableMethods.push(method.auth_method);
          socialProviders.push({
            provider: method.auth_method,
            providerId: method.provider_id,
            isPrimary: method.is_primary
          });
        }
      });

      // Determine suggestions based on available methods
      const suggestions = this.generateSuggestions(availableMethods, user);

      // Create appropriate message
      const message = this.generateMessage(availableMethods, user, socialProviders);

      return {
        exists: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          isVerified: user.is_verified,
          approvalStatus: user.approval_status
        },
        methods: availableMethods,
        socialProviders,
        suggestions,
        message,
        requiresVerification: !user.is_verified,
        requiresApproval: user.approval_status !== 'approved'
      };
    } catch (error) {
      console.error('Error detecting auth methods:', error);
      return {
        exists: false,
        methods: [],
        suggestions: ['signup'],
        message: 'Unable to check authentication methods. Please try again.',
        error: true
      };
    }
  }

  // Generate smart suggestions based on available methods
  generateSuggestions(methods, user) {
    const suggestions = [];

    if (methods.length === 0) {
      // No auth methods - this shouldn't happen for existing users
      suggestions.push('contact_support');
      return suggestions;
    }

    // Always suggest primary authentication methods first
    if (methods.includes('password')) {
      suggestions.push('password');
    }

    // Suggest social login methods
    const socialMethods = methods.filter(m => ['google', 'linkedin', 'facebook', 'github'].includes(m));
    suggestions.push(...socialMethods);

    // If user has multiple methods, suggest the most convenient
    if (methods.length > 1) {
      suggestions.push('choose_method');
    }

    // If user is not verified, suggest email verification
    if (!user.is_verified) {
      suggestions.push('verify_email');
    }

    // If user is not approved, inform about approval status
    if (user.approval_status === 'pending') {
      suggestions.push('pending_approval');
    } else if (user.approval_status === 'rejected') {
      suggestions.push('resubmit_application');
    }

    return suggestions;
  }

  // Generate user-friendly message
  generateMessage(methods, user, socialProviders) {
    const firstName = user.first_name || 'there';

    if (methods.length === 0) {
      return `Hi ${firstName}, there seems to be an issue with your account. Please contact support.`;
    }

    if (methods.length === 1) {
      const method = methods[0];
      if (method === 'password') {
        return `Hi ${firstName}, please enter your password to continue.`;
      } else {
        const providerName = this.getProviderDisplayName(method);
        return `Hi ${firstName}, please sign in with your ${providerName} account.`;
      }
    }

    // Multiple methods available
    const hasPassword = methods.includes('password');
    const hasSocial = methods.some(m => ['google', 'linkedin', 'facebook', 'github'].includes(m));

    if (hasPassword && hasSocial) {
      const socialList = socialProviders
        .map(p => this.getProviderDisplayName(p.provider))
        .join(', ');
      return `Hi ${firstName}, you can sign in with your password or using: ${socialList}.`;
    }

    if (hasSocial && !hasPassword) {
      const socialList = socialProviders
        .map(p => this.getProviderDisplayName(p.provider))
        .join(', ');
      return `Hi ${firstName}, please sign in using: ${socialList}.`;
    }

    return `Hi ${firstName}, please choose your preferred sign-in method.`;
  }

  // Get display name for providers
  getProviderDisplayName(provider) {
    const names = {
      google: 'Google',
      linkedin: 'LinkedIn',
      facebook: 'Facebook',
      github: 'GitHub'
    };
    return names[provider] || provider;
  }

  // Check if user can use password login
  async canUsePasswordLogin(email) {
    try {
      const user = await getOne(
        'SELECT u.id, u.password_hash FROM users u WHERE u.email = ?',
        [email]
      );

      if (!user || !user.password_hash) {
        return false;
      }

      // Check if password auth method is active
      const authMethod = await getOne(
        'SELECT is_active FROM user_auth_methods WHERE user_id = ? AND auth_method = "password"',
        [user.id]
      );

      return authMethod && authMethod.is_active;
    } catch (error) {
      console.error('Error checking password login capability:', error);
      return false;
    }
  }

  // Add new authentication method to user
  async addAuthMethod(userId, method, providerData = {}) {
    try {
      const { providerId, providerEmail, additionalData } = providerData;

      await executeQuery(
        `INSERT INTO user_auth_methods
         (user_id, auth_method, provider_id, provider_email, provider_data, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [userId, method, providerId || null, providerEmail || null, JSON.stringify(additionalData || {})]
      );

      return true;
    } catch (error) {
      console.error('Error adding auth method:', error);
      return false;
    }
  }

  // Remove authentication method
  async removeAuthMethod(userId, method, providerId = null) {
    try {
      let query = 'DELETE FROM user_auth_methods WHERE user_id = ? AND auth_method = ?';
      let params = [userId, method];

      if (providerId) {
        query += ' AND provider_id = ?';
        params.push(providerId);
      }

      await executeQuery(query, params);
      return true;
    } catch (error) {
      console.error('Error removing auth method:', error);
      return false;
    }
  }

  // Set primary authentication method
  async setPrimaryAuthMethod(userId, method, providerId = null) {
    try {
      // First, unset all primary flags for this user
      await executeQuery(
        'UPDATE user_auth_methods SET is_primary = FALSE WHERE user_id = ?',
        [userId]
      );

      // Then set the specified method as primary
      let query = 'UPDATE user_auth_methods SET is_primary = TRUE WHERE user_id = ? AND auth_method = ?';
      let params = [userId, method];

      if (providerId) {
        query += ' AND provider_id = ?';
        params.push(providerId);
      }

      await executeQuery(query, params);
      return true;
    } catch (error) {
      console.error('Error setting primary auth method:', error);
      return false;
    }
  }

  // Get user's primary authentication method
  async getPrimaryAuthMethod(userId) {
    try {
      const method = await getOne(
        'SELECT auth_method, provider_id FROM user_auth_methods WHERE user_id = ? AND is_primary = TRUE',
        [userId]
      );

      return method;
    } catch (error) {
      console.error('Error getting primary auth method:', error);
      return null;
    }
  }

  // Check if linking social account is possible
  async canLinkSocialAccount(email, provider, providerId) {
    try {
      // Check if this provider ID is already linked to another account
      const existingLink = await getOne(
        `SELECT u.email FROM user_auth_methods uam
         JOIN users u ON uam.user_id = u.id
         WHERE uam.auth_method = ? AND uam.provider_id = ?`,
        [provider, providerId]
      );

      if (existingLink && existingLink.email !== email) {
        return {
          canLink: false,
          reason: 'already_linked',
          message: `This ${this.getProviderDisplayName(provider)} account is already linked to another Zuvomo account.`
        };
      }

      // Check if user exists
      const user = await getOne('SELECT id FROM users WHERE email = ?', [email]);

      if (!user) {
        return {
          canLink: false,
          reason: 'no_account',
          message: 'No Zuvomo account found with this email address.'
        };
      }

      // Check if already linked to this user
      const userLink = await getOne(
        'SELECT id FROM user_auth_methods WHERE user_id = ? AND auth_method = ?',
        [user.id, provider]
      );

      if (userLink) {
        return {
          canLink: false,
          reason: 'already_linked_user',
          message: `Your account is already linked to ${this.getProviderDisplayName(provider)}.`
        };
      }

      return {
        canLink: true,
        userId: user.id,
        message: `You can link your ${this.getProviderDisplayName(provider)} account.`
      };
    } catch (error) {
      console.error('Error checking social account linking:', error);
      return {
        canLink: false,
        reason: 'error',
        message: 'Unable to check account linking status.'
      };
    }
  }
}

// Create and export singleton instance
const authDetectionService = new AuthDetectionService();

module.exports = authDetectionService;