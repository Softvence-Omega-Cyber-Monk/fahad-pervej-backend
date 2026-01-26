import nodemailer from 'nodemailer';

export class CustomerEmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private fromName: string;
  private customerDashboardUrl: string;

  constructor() {
    // Use MAIL_* variables (preferred) or fallback to SMTP_* variables
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'mail5018.site4now.net';
    const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587');
    const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || '';
    const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || '';
    const encryption = process.env.MAIL_ENCRYPTION || 'tls';
    
    // Set from address and name
    this.fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || user;
    this.fromName = process.env.MAIL_FROM_NAME || process.env.COMPANY_NAME || 'MDItems';
    this.customerDashboardUrl = process.env.CUSTOMER_DASHBOARD_URL || 'http://localhost:5173';

    const transportConfig: any = {
      host: host,
      port: port,
      secure: port === 465,
      auth: {
        user: user,
        pass: pass
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      requireTLS: encryption === 'tls',
      debug: process.env.NODE_ENV !== 'production',
      logger: process.env.NODE_ENV !== 'production'
    };

    this.transporter = nodemailer.createTransport(transportConfig);

    // Test connection on initialization
    this.testConnection();
  }

  /**
   * Send customer registration welcome email
   */
  async sendCustomerWelcomeEmail(
    customerEmail: string, 
    customerName: string
  ): Promise<void> {
    try {
      console.log(`📧 Sending welcome email to customer: ${customerEmail}`);

      // Validate email address
      if (!customerEmail || !this.isValidEmail(customerEmail)) {
        console.error(`❌ Invalid customer email address: ${customerEmail}`);
        throw new Error(`Invalid customer email address: ${customerEmail}`);
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${this.fromName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 32px;">🎉 Welcome to ${this.fromName}!</h1>
              <p style="margin: 0; color: #f0f0f0; font-size: 16px;">Your account has been created successfully</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Dear <strong>${customerName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                Thank you for joining <strong>${this.fromName}</strong>! We're thrilled to have you as part of our community. Your journey to discover amazing products starts now! 🚀
              </p>

              <div style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px; color: #333; text-align: center;">
                  ✨ Your Account Details
                </h3>
                <table width="100%" cellpadding="10" cellspacing="0">
                  <tr>
                    <td style="color: #555; font-size: 14px;">Name:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="color: #555; font-size: 14px;">Email:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${customerEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #555; font-size: 14px;">Account Type:</td>
                    <td style="text-align: right;">
                      <span style="background-color: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        👤 Customer
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <h3 style="margin: 30px 0 20px 0; font-size: 20px; color: #333; text-align: center;">🎁 What You Can Do Now</h3>
              
              <div style="margin: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="background-color: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">🛍️</div>
                        <strong style="color: #333; font-size: 16px;">Browse Products</strong>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666; line-height: 1.5;">
                          Explore thousands of products from verified vendors
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="background-color: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">💳</div>
                        <strong style="color: #333; font-size: 16px;">Secure Checkout</strong>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666; line-height: 1.5;">
                          Shop with confidence using our secure payment system
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="background-color: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">📦</div>
                        <strong style="color: #333; font-size: 16px;">Track Orders</strong>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666; line-height: 1.5;">
                          Stay updated with real-time order tracking
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 15px 0;">
                      <div style="background-color: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px;">
                        <div style="font-size: 24px; margin-bottom: 10px;">⭐</div>
                        <strong style="color: #333; font-size: 16px;">Leave Reviews</strong>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #666; line-height: 1.5;">
                          Share your experience and help other shoppers
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${this.customerDashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 45px; border-radius: 30px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  🛒 Start Shopping Now
                </a>
              </div>

              <div style="background-color: #fff3cd; padding: 18px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #856404; line-height: 1.6;">
                  <strong>💡 Pro Tip:</strong> Complete your profile and add your shipping address to enjoy faster checkout and personalized recommendations!
                </p>
              </div>

              <div style="background-color: #d1ecf1; padding: 18px; border-radius: 8px; border-left: 4px solid #17a2b8; margin: 25px 0;">
                <p style="margin: 0; font-size: 14px; color: #0c5460; line-height: 1.6;">
                  <strong>🔒 Security Note:</strong> We never ask for your password via email. If you receive suspicious emails, please contact our support team immediately.
                </p>
              </div>

              <p style="margin: 25px 0 0 0; font-size: 15px; color: #333; line-height: 1.6; text-align: center;">
                Happy Shopping! 🎉<br>
                <strong>The ${this.fromName} Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 25px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; text-align: center;">
                Need help? Contact us at <a href="mailto:${this.fromAddress}" style="color: #667eea; text-decoration: none;">${this.fromAddress}</a>
              </p>
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #999; text-align: center;">
                This is an automated notification. Please do not reply to this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999; text-align: center;">
                &copy; ${new Date().getFullYear()} ${this.fromName}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: customerEmail,
        subject: `🎉 Welcome to ${this.fromName} - Let's Get Started!`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Customer welcome email sent successfully to: ${customerEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending customer welcome email:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      // Don't throw error to prevent registration failure
    }
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Test email configuration
   */
  private async testConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      console.log('✅ Customer Email service is ready and verified');
      console.log(`📧 From: "${this.fromName}" <${this.fromAddress}>`);
    } catch (error) {
      console.error('❌ Customer Email service configuration error:', error);
    }
  }
}

export const customerEmailService = new CustomerEmailService();