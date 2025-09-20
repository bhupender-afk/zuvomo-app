const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
  }

  // Welcome email template for approved users
  getWelcomeEmailTemplate(user) {
    const { first_name, last_name, role, email } = user;
    const dashboardUrl = role === 'project_owner' ? '/project-owner' : '/investor';

    return {
      subject: '🎉 Welcome to Zuvomo - Your Account is Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Zuvomo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2C91D5 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/1dff84ef9a6b5c3ed5b94cf511907445481c3c6b?placeholderIfAbsent=true" alt="Zuvomo Logo" style="height: 40px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Welcome to Zuvomo!</h1>
              <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">Your account has been approved</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${first_name} ${last_name}!</h2>

              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Great news! Your Zuvomo account has been approved and is now active. You can now access all the features available to ${role.replace('_', ' ')}s on our platform.
              </p>

              <div style="background-color: #f0f9ff; border-left: 4px solid #2C91D5; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">What's Next?</h3>
                <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                  ${role === 'project_owner' ? `
                    <li>Create and submit your first project for review</li>
                    <li>Upload project images and business documents</li>
                    <li>Track your project's funding progress</li>
                    <li>Connect with potential investors</li>
                  ` : `
                    <li>Browse and discover investment opportunities</li>
                    <li>Create your personalized watchlist</li>
                    <li>Rate and review projects</li>
                    <li>Track your investment portfolio</li>
                  `}
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}${dashboardUrl}"
                   style="background-color: #2C91D5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Access Your Dashboard
                </a>
              </div>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Account Details:</h4>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Account Type:</strong> ${role.replace('_', ' ')}</p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Status:</strong> Approved & Active</p>
              </div>

              <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                If you have any questions or need assistance, please don't hesitate to contact our support team at
                <a href="mailto:support@zuvomo.com" style="color: #2C91D5;">support@zuvomo.com</a>.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2024 Zuvomo. All rights reserved.<br>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #2C91D5; text-decoration: none;">Visit Zuvomo</a> |
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" style="color: #2C91D5; text-decoration: none;">Privacy Policy</a> |
                <a href="mailto:support@zuvomo.com" style="color: #2C91D5; text-decoration: none;">Support</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Zuvomo!

        Hello ${first_name} ${last_name},

        Great news! Your Zuvomo account has been approved and is now active. You can now access all the features available to ${role.replace('_', ' ')}s on our platform.

        Account Details:
        - Email: ${email}
        - Account Type: ${role.replace('_', ' ')}
        - Status: Approved & Active

        Access your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}${dashboardUrl}

        If you have any questions, contact us at support@zuvomo.com

        Best regards,
        The Zuvomo Team
      `
    };
  }

  // Rejection email template
  getRejectionEmailTemplate(user, rejectionReason) {
    const { first_name, last_name, email, role } = user;

    return {
      subject: '📋 Zuvomo Account Application Update',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Zuvomo Account Update</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 0;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; text-align: center;">
              <img src="https://api.builder.io/api/v1/image/assets/TEMP/1dff84ef9a6b5c3ed5b94cf511907445481c3c6b?placeholderIfAbsent=true" alt="Zuvomo Logo" style="height: 40px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Account Application Update</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hello ${first_name} ${last_name},</h2>

              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                Thank you for your interest in joining Zuvomo. After careful review, we are unable to approve your account application at this time.
              </p>

              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 18px;">Reason for Rejection:</h3>
                <p style="color: #7f1d1d; margin: 0; font-size: 16px;">${rejectionReason}</p>
              </div>

              <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h3 style="color: #16a34a; margin: 0 0 10px 0; font-size: 18px;">What You Can Do:</h3>
                <ul style="color: #166534; margin: 0; padding-left: 20px;">
                  <li>Review and address the feedback provided above</li>
                  <li>Resubmit your application with updated information</li>
                  <li>Contact our support team for clarification if needed</li>
                  <li>Ensure all required documentation is complete and accurate</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup"
                   style="background-color: #2C91D5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">
                  Resubmit Application
                </a>
              </div>

              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">Application Details:</h4>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Applied as:</strong> ${role.replace('_', ' ')}</p>
                <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
                We appreciate your interest in Zuvomo and encourage you to reapply once you've addressed the feedback.
                If you have questions, please contact our support team at
                <a href="mailto:support@zuvomo.com" style="color: #2C91D5;">support@zuvomo.com</a>.
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 14px;">
                © 2024 Zuvomo. All rights reserved.<br>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="color: #2C91D5; text-decoration: none;">Visit Zuvomo</a> |
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/privacy" style="color: #2C91D5; text-decoration: none;">Privacy Policy</a> |
                <a href="mailto:support@zuvomo.com" style="color: #2C91D5; text-decoration: none;">Support</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Zuvomo Account Application Update

        Hello ${first_name} ${last_name},

        Thank you for your interest in joining Zuvomo. After careful review, we are unable to approve your account application at this time.

        Reason: ${rejectionReason}

        You can resubmit your application after addressing the feedback provided.

        Application Details:
        - Email: ${email}
        - Applied as: ${role.replace('_', ' ')}
        - Review Date: ${new Date().toLocaleDateString()}

        For questions, contact support@zuvomo.com

        Best regards,
        The Zuvomo Team
      `
    };
  }

  // Send welcome email
  async sendWelcomeEmail(user) {
    try {
      const template = this.getWelcomeEmailTemplate(user);

      const mailOptions = {
        from: `"Zuvomo Platform" <${process.env.SMTP_USER || 'noreply@zuvomo.com'}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send rejection email
  async sendRejectionEmail(user, rejectionReason) {
    try {
      const template = this.getRejectionEmailTemplate(user, rejectionReason);

      const mailOptions = {
        from: `"Zuvomo Platform" <${process.env.SMTP_USER || 'noreply@zuvomo.com'}>`,
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Rejection email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending rejection email:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready');
      return true;
    } catch (error) {
      console.error('Email service configuration error:', error);
      return false;
    }
  }
}

module.exports = new EmailService();