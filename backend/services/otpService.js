const nodemailer = require('nodemailer');
const crypto = require('crypto');
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
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('✅ SMTP transporter created successfully');
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

  // Send OTP email
  async sendOTPEmail(email, otpCode, type = 'email_verification', userName = '') {
    console.log('📧 Attempting to send OTP email:');
    console.log('  - To:', email);
    console.log('  - Type:', type);
    console.log('  - User:', userName);
    console.log('  - OTP Code:', otpCode);
    const emailTemplates = {
      email_verification: {
        subject: 'Verify Your Email - Zuvomo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2C91D5; margin: 0;">Zuvomo</h1>
              <p style="color: #666; margin: 5px 0;">Investment Platform</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
              <p style="color: #666; line-height: 1.6;">
                Hi ${userName || 'there'},<br><br>
                Welcome to Zuvomo! Please use the verification code below to verify your email address:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #2C91D5; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                  ${otpCode}
                </div>
              </div>

              <p style="color: #666; line-height: 1.6;">
                This code will expire in 10 minutes. If you didn't request this verification, please ignore this email.
              </p>
            </div>

            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>© 2024 Zuvomo. All rights reserved.</p>
            </div>
          </div>
        `
      },
      login: {
        subject: 'Your Login Code - Zuvomo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2C91D5; margin: 0;">Zuvomo</h1>
              <p style="color: #666; margin: 5px 0;">Investment Platform</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Login Verification</h2>
              <p style="color: #666; line-height: 1.6;">
                Hi ${userName || 'there'},<br><br>
                Use the code below to complete your login to Zuvomo:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #2C91D5; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                  ${otpCode}
                </div>
              </div>

              <p style="color: #666; line-height: 1.6;">
                This code will expire in 10 minutes. If you didn't request this login, please ignore this email and consider changing your password.
              </p>
            </div>

            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>© 2024 Zuvomo. All rights reserved.</p>
            </div>
          </div>
        `
      },
      password_reset: {
        subject: 'Reset Your Password - Zuvomo',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2C91D5; margin: 0;">Zuvomo</h1>
              <p style="color: #666; margin: 5px 0;">Investment Platform</p>
            </div>

            <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">Password Reset</h2>
              <p style="color: #666; line-height: 1.6;">
                Hi ${userName || 'there'},<br><br>
                Use the code below to reset your Zuvomo password:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #dc3545; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 5px; display: inline-block;">
                  ${otpCode}
                </div>
              </div>

              <p style="color: #666; line-height: 1.6;">
                This code will expire in 10 minutes. If you didn't request a password reset, please ignore this email and consider changing your password.
              </p>
            </div>

            <div style="text-align: center; color: #999; font-size: 14px;">
              <p>© 2024 Zuvomo. All rights reserved.</p>
            </div>
          </div>
        `
      }
    };

    const template = emailTemplates[type] || emailTemplates.email_verification;

    try {
      console.log('📮 Sending email via transporter...');
      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"Zuvomo Platform" <support@zuvomo.com>',
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text || undefined,
      });

      console.log('✅ OTP email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Error sending OTP email:');
      console.error('  - Error message:', error.message);
      console.error('  - Error code:', error.code);
      console.error('  - Full error:', error);
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