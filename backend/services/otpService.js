const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { executeQuery, getOne } = require('../config/database');

class OTPService {
  constructor() {
    console.log('🔧 OTP Service Initialization');
    console.log('📧 SMTP Configuration Check:');
    console.log('  - SMTP_HOST:', process.env.SMTP_HOST ? '✅ Set' : '❌ Missing');
    console.log('  - SMTP_PORT:', process.env.SMTP_PORT || 'Using default 587');
    console.log('  - SMTP_USER:', process.env.SMTP_USER ? '✅ Set' : '❌ Missing');
    console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✅ Set' : '❌ Missing');
    console.log('  - SMTP_SECURE:', process.env.SMTP_SECURE || 'Using default false');

    // Initialize email transporter
    if (process.env.SMTP_HOST) {
      console.log('📬 Creating real SMTP transporter...');

      // Auto-detect secure based on port if not explicitly set
      const port = parseInt(process.env.SMTP_PORT || 587);
      // Gmail SMTP: port 465 uses SSL, port 587 uses STARTTLS (secure=false)
      const isSecure = port === 465 ? true : (process.env.SMTP_SECURE === 'true');

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: isSecure, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        // Additional configuration for better compatibility and timeouts
        connectionTimeout: 60000, // 60 seconds for slower networks
        greetingTimeout: 30000,   // 30 seconds
        socketTimeout: 45000,     // 45 seconds
        // Connection pooling for better reliability
        pool: true,
        maxConnections: 5,
        maxMessages: 10,
        tls: {
          rejectUnauthorized: false // Allow self-signed certificates in dev
        }
      });

      console.log(`✅ SMTP transporter created (Port: ${port}, Secure: ${isSecure})`);

      // Verify connection on initialization (with timeout handling)
      const verifyTimeout = setTimeout(() => {
        console.warn('⚠️  SMTP verification timeout - continuing with fallback mode');
        console.warn('   This may indicate network/firewall issues with external SMTP');
      }, 10000);

      this.transporter.verify((error) => {
        clearTimeout(verifyTimeout);
        if (error) {
          console.error('❌ SMTP connection verification failed:', error.message);
          console.error('   Note: Check your SMTP settings and firewall/network configuration');
          console.warn('🔄 Enabling fallback mode for email debugging');
          this.fallbackMode = true;
        } else {
          console.log('✅ SMTP server connection verified successfully');
          this.fallbackMode = false;
        }
      });
    } else {
      console.log('⚠️  No SMTP configuration found - using fallback console logger');
      // Fallback to console logging in development
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('=== EMAIL WOULD BE SENT (FALLBACK) ===');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('Content:', mailOptions.html || mailOptions.text);
          console.log('====================================');
          return { messageId: 'dev-' + Date.now() };
        }
      };
    }
  }

  // Load email template from file
  loadTemplate(templateName) {
    try {
      // Try multiple possible template paths
      const possiblePaths = [
        path.join(__dirname, '..', 'templates', templateName),
        path.join(process.cwd(), 'backend', 'templates', templateName),
        path.join(process.cwd(), 'templates', templateName)
      ];

      let templatePath = null;
      for (const testPath of possiblePaths) {
        console.log(`📧 Testing template path: ${testPath}`);
        if (fs.existsSync(testPath)) {
          templatePath = testPath;
          break;
        }
      }

      if (!templatePath) {
        console.warn(`⚠️  Template file not found: ${templateName}`);
        console.warn(`   Searched paths:`, possiblePaths);
        return null;
      }

      console.log(`📧 Loading email template from: ${templatePath}`);
      const template = fs.readFileSync(templatePath, 'utf8');
      console.log(`✅ Template loaded successfully: ${templateName} (${template.length} characters)`);
      return template;
    } catch (error) {
      console.error(`❌ Error loading template ${templateName}:`, error.message);
      console.error(`   Stack:`, error.stack);
      return null;
    }
  }

  // Replace template variables with actual values
  replaceTemplateVariables(template, variables) {
    let processedTemplate = template;

    // Default variables
    const defaultVars = {
      website_url: process.env.FRONTEND_URL || 'https://zuvomo.com',
      otp_expiry_minutes: '10',
      company_name: 'Zuvomo',
      current_year: new Date().getFullYear().toString()
    };

    // Merge default and provided variables
    const allVariables = { ...defaultVars, ...variables };

    // Replace all template variables
    Object.keys(allVariables).forEach(key => {
      const placeholder = `{{${key}}}`;
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), allVariables[key] || '');
    });

    console.log('✅ Template variables replaced successfully');
    return processedTemplate;
  }

  // Generate a 6-digit OTP code
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Store OTP in database
  async storeOTP(userId, email, otpCode, type = 'email_verification', expiresInMinutes = 10) {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    // Ensure type matches database ENUM values
    const validTypes = ['email_verification', 'login', 'password_reset'];
    const otpType = validTypes.includes(type) ? type : 'email_verification';

    try {
      await executeQuery(
        `INSERT INTO user_otp_verifications
         (user_id, email, otp_code, otp_type, expires_at, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, email, otpCode, otpType, expiresAt, null, null]
      );

      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  }

  // Retry helper function with exponential backoff
  async retryWithBackoff(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        console.log(`⚠️  Attempt ${attempt}/${maxAttempts} failed:`, error.message);

        if (attempt === maxAttempts) {
          throw error;
        }

        // Exponential backoff: wait 1s, 2s, 4s, etc.
        const waitTime = delay * Math.pow(2, attempt - 1);
        console.log(`🔄 Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  // Send OTP email
  async sendOTPEmail(email, otpCode, type = 'email_verification', userName = '') {
    console.log('📧 Attempting to send OTP email:');
    console.log('  - To:', email);
    console.log('  - Type:', type);
    console.log('  - User:', userName);
    console.log('  - OTP Code:', otpCode);

    // Template mapping for different OTP types
    const templateMap = {
      email_verification: {
        file: 'otp-send.html',
        subject: 'Verify Your Email - Zuvomo'
      },
      login: {
        file: 'otp-send.html',
        subject: 'Your Login Code - Zuvomo'
      },
      password_reset: {
        file: 'password-reset.html',
        subject: 'Reset Your Password - Zuvomo'
      }
    };

    const templateConfig = templateMap[type] || templateMap.email_verification;

    // Load HTML template
    let htmlTemplate = this.loadTemplate(templateConfig.file);

    // Fallback to basic template if file loading fails
    if (!htmlTemplate) {
      console.warn('⚠️  Falling back to basic inline template');
      htmlTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2F3A63; margin: 0;">Zuvomo</h1>
            <p style="color: #666; margin: 5px 0;">Investment Platform</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Verification Code</h2>
            <p style="color: #666; line-height: 1.6;">Hi {{user_name}}, your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background: #2F3A63; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                {{otp_code}}
              </div>
            </div>
            <p style="color: #666; line-height: 1.6;">This code expires in {{otp_expiry_minutes}} minutes.</p>
          </div>
          <div style="text-align: center; color: #999; font-size: 14px;">
            <p>© {{current_year}} Zuvomo. All rights reserved.</p>
          </div>
        </div>`;
    }

    // Prepare template variables
    const templateVariables = {
      otp_code: otpCode,
      user_name: userName || 'there',
      otp_type: type,
      email: email
    };

    console.log('📧 Template variables prepared:', {
      otp_code: otpCode,
      user_name: userName || 'there',
      otp_type: type,
      email: email,
      template_length: htmlTemplate ? htmlTemplate.length : 0
    });

    // Replace template variables
    const processedHtml = this.replaceTemplateVariables(htmlTemplate, templateVariables);

    // Create plain text version for better deliverability
    const plainText = `
Zuvomo - ${templateConfig.subject}

Hello ${userName || 'there'},

Your verification code is: ${otpCode}

This code will expire in 10 minutes.

IMPORTANT SECURITY NOTICE:
- Never share this code with anyone
- Zuvomo will never ask for this code via phone or email
- If you didn't request this, please ignore this email

Best regards,
The Zuvomo Team

© ${new Date().getFullYear()} Zuvomo Private Limited. All rights reserved.
Website: https://zuvomo.com
    `.trim();

    try {
      console.log('📮 Sending email via transporter with retry logic...');

      const info = await this.retryWithBackoff(async () => {
        return await this.transporter.sendMail({
          from: process.env.SMTP_FROM || '"Zuvomo" <support@zuvomo.com>',
          to: email,
          subject: templateConfig.subject,
          html: processedHtml,
          text: plainText, // Add plain text version
          headers: {
            'X-Mailer': 'Zuvomo Platform',
            'X-Priority': '1',
            'Reply-To': 'product@sethinikhil.com',
            'List-Unsubscribe': '<mailto:product@sethinikhil.com?subject=Unsubscribe>',
          },
        });
      }, 3, 1000);

      console.log('✅ OTP email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:');
      console.error('  - Error message:', error.message);
      console.error('  - Error code:', error.code);

      // If SMTP fails, show what would have been sent (for debugging)
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.log('🔄 SMTP failed due to connectivity - showing email content for debugging:');
        console.log('================== EMAIL CONTENT ==================');
        console.log('📧 TO:', email);
        console.log('📧 SUBJECT:', templateConfig.subject);
        console.log('📧 OTP CODE:', otpCode);
        console.log('📧 TEMPLATE USED:', templateConfig.file);
        console.log('📧 HTML LENGTH:', processedHtml.length, 'characters');
        console.log('📧 FIRST 200 CHARS:', processedHtml.substring(0, 200) + '...');
        console.log('==================================================');
        console.warn('⚠️  The template was loaded and processed correctly, but SMTP delivery failed');
        console.warn('   Check network connectivity to smtp.gmail.com:587');
      }

      return false;
    }
  }

  // Generate and send OTP
  async generateAndSendOTP(userId, email, type = 'email_verification', userName = '') {
    console.log('🚀 Starting OTP generation and sending process:');
    console.log('  - User ID:', userId);
    console.log('  - Email:', email);
    console.log('  - Type:', type);
    console.log('  - User Name:', userName);
    
    try {
      // Generate OTP
      const otpCode = this.generateOTP();

      console.log('💾 Storing OTP in database...');
      // Store in database
      const stored = await this.storeOTP(userId, email, otpCode, type);
      if (!stored) {
        console.error('❌ Failed to store OTP in database');
        return { success: false, error: 'Failed to store OTP' };
      }
      console.log('✅ OTP stored in database successfully');

      // Send email
      const sent = await this.sendOTPEmail(email, otpCode, type, userName);
      if (!sent) {
        console.error('❌ Failed to send OTP email');
        return { success: false, error: 'Failed to send OTP email' };
      }

      console.log('🎉 OTP generation and sending completed successfully');
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      console.error('❌ Critical error in generateAndSendOTP:');
      console.error('  - Error message:', error.message);
      console.error('  - Stack trace:', error.stack);
      return { success: false, error: 'Failed to send OTP' };
    }
  }

  // Verify OTP
  async verifyOTP(email, otpCode, type = 'email_verification') {
    try {
      // Ensure type matches database ENUM values
      const validTypes = ['email_verification', 'login', 'password_reset'];
      const otpType = validTypes.includes(type) ? type : 'email_verification';

      // Find valid, unused OTP
      const otpRecord = await getOne(
        `SELECT * FROM user_otp_verifications
         WHERE email = ? AND otp_code = ? AND otp_type = ?
         AND is_used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, otpCode, otpType]
      );

      if (!otpRecord) {
        return {
          success: false,
          error: 'Invalid or expired OTP code',
          errorCode: 'INVALID_OTP'
        };
      }

      // Mark OTP as used
      await executeQuery(
        'UPDATE user_otp_verifications SET is_used = TRUE, used_at = NOW() WHERE id = ?',
        [otpRecord.id]
      );

      return {
        success: true,
        message: 'OTP verified successfully',
        userId: otpRecord.user_id
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: 'Failed to verify OTP' };
    }
  }

  // Clean up expired OTPs (maintenance function)
  async cleanupExpiredOTPs() {
    try {
      const result = await executeQuery(
        'DELETE FROM user_otp_verifications WHERE expires_at < NOW() OR (is_used = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))'
      );

      console.log(`Cleaned up ${result.affectedRows} expired OTP records`);
      return result.affectedRows;
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
      return 0;
    }
  }

  // Check if email has pending OTP (rate limiting)
  async hasPendingOTP(email, type = 'email_verification', withinMinutes = 2) {
    try {
      const since = new Date(Date.now() - withinMinutes * 60 * 1000);

      const record = await getOne(
        `SELECT id FROM user_otp_verifications
         WHERE email = ? AND otp_type = ? AND created_at > ?
         ORDER BY created_at DESC LIMIT 1`,
        [email, type, since]
      );

      return !!record;
    } catch (error) {
      console.error('Error checking pending OTP:', error);
      return false;
    }
  }

  // Update attempt count
  async incrementAttempts(email, otpCode) {
    try {
      await executeQuery(
        'UPDATE user_otp_verifications SET attempts = attempts + 1 WHERE email = ? AND otp_code = ?',
        [email, otpCode]
      );
    } catch (error) {
      console.error('Error incrementing OTP attempts:', error);
    }
  }

  // Check if too many attempts
  async hasExceededAttempts(email, maxAttempts = 5) {
    try {
      const record = await getOne(
        `SELECT attempts FROM user_otp_verifications
         WHERE email = ? AND is_used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email]
      );

      return record && record.attempts >= maxAttempts;
    } catch (error) {
      console.error('Error checking OTP attempts:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const otpService = new OTPService();

module.exports = otpService;
