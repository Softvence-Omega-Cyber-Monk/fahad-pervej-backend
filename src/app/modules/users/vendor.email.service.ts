import nodemailer from 'nodemailer';

export class VendorEmailService {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private fromName: string;
  private vendorDashboardUrl: string;

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
    this.vendorDashboardUrl = process.env.VENDOR_DASHBOARD_URL || 'http://localhost:5173/vendor';

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
   * Send vendor registration pending approval email
   */
  async sendVendorRegistrationPendingEmail(
    vendorEmail: string, 
    vendorName: string, 
    businessName: string
  ): Promise<void> {
    try {
      console.log(`📧 Sending registration pending email to vendor: ${vendorEmail}`);

      // Validate email address
      if (!vendorEmail || !this.isValidEmail(vendorEmail)) {
        console.error(`❌ Invalid vendor email address: ${vendorEmail}`);
        throw new Error(`Invalid vendor email address: ${vendorEmail}`);
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendor Registration Pending</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #FF9800; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✅ Registration Submitted!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Dear <strong>${vendorName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                Thank you for registering with <strong>${this.fromName}</strong>! We're excited to have <strong>${businessName}</strong> join our platform.
              </p>

              <div style="background-color: #fff3e0; padding: 20px; border-radius: 6px; border-left: 4px solid #FF9800; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #e65100;">
                  📋 What Happens Next?
                </h3>
                <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
                  Your vendor application is currently under review by our admin team. This process typically takes <strong>1-3 business days</strong>.
                </p>
              </div>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">📝 Registration Details:</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Business Name:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Contact Email:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${vendorEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Status:</td>
                    <td style="text-align: right;">
                      <span style="background-color: #FF9800; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ⏳ Pending Approval
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 20px 0; font-size: 14px; color: #666; line-height: 1.6;">
                You will receive another email once your account has been reviewed and approved. Once approved, you'll be able to:
              </p>

              <ul style="margin: 10px 0 20px 20px; padding: 0; color: #666; font-size: 14px; line-height: 1.8;">
                <li>✓ Access your vendor dashboard</li>
                <li>✓ List and manage your products</li>
                <li>✓ Track orders and sales</li>
                <li>✓ Manage your store settings</li>
                <li>✓ Start selling to customers</li>
              </ul>

              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #1565c0; line-height: 1.5;">
                  <strong>💡 Tip:</strong> While you wait, you can prepare your product listings, high-quality images, and product descriptions to hit the ground running once approved!
                </p>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 14px; color: #666;">
                If you have any questions in the meantime, please don't hesitate to contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
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
        to: vendorEmail,
        subject: `Registration Received - Pending Approval | ${this.fromName}`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Vendor registration pending email sent successfully to: ${vendorEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending vendor registration pending email:', error);
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
   * Send vendor account approved email
   */
  async sendVendorApprovedEmail(
    vendorEmail: string, 
    vendorName: string, 
    businessName: string
  ): Promise<void> {
    try {
      console.log(`📧 Sending account approved email to vendor: ${vendorEmail}`);

      // Validate email address
      if (!vendorEmail || !this.isValidEmail(vendorEmail)) {
        console.error(`❌ Invalid vendor email address: ${vendorEmail}`);
        throw new Error(`Invalid vendor email address: ${vendorEmail}`);
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vendor Account Approved</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #4CAF50; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Account Approved!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Dear <strong>${vendorName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333; line-height: 1.6;">
                Great news! Your vendor account for <strong>${businessName}</strong> has been approved by our admin team. You can now start selling on ${this.fromName}! 🚀
              </p>

              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px; border-left: 4px solid #4CAF50; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #2e7d32;">
                  ✅ Your Account is Now Active!
                </h3>
                <p style="margin: 0; font-size: 14px; color: #1b5e20; line-height: 1.6;">
                  You now have full access to your vendor dashboard and can begin listing your products.
                </p>
              </div>

              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #333;">📊 Account Information:</h3>
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Business Name:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${businessName}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Vendor Email:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${vendorEmail}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Status:</td>
                    <td style="text-align: right;">
                      <span style="background-color: #4CAF50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ✓ Approved & Active
                      </span>
                    </td>
                  </tr>
                </table>
              </div>

              <h3 style="margin: 30px 0 15px 0; font-size: 18px; color: #333;">🚀 Get Started Now:</h3>
              
              <div style="margin: 20px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px;">
                        <strong style="color: #333; font-size: 14px;">1️⃣ Access Your Dashboard</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
                          Log in to manage your store, products, and orders.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px;">
                        <strong style="color: #333; font-size: 14px;">2️⃣ List Your Products</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
                          Add products with high-quality images and detailed descriptions.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px;">
                        <strong style="color: #333; font-size: 14px;">3️⃣ Start Selling</strong>
                        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">
                          Your products will be visible to customers immediately after listing.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${this.vendorDashboardUrl}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
                  Access Vendor Dashboard →
                </a>
              </div>

              <div style="background-color: #fff9e6; padding: 15px; border-radius: 6px; border-left: 4px solid #FFC107; margin: 20px 0;">
                <p style="margin: 0; font-size: 13px; color: #f57c00; line-height: 1.5;">
                  <strong>💡 Pro Tip:</strong> Complete your store profile, add a banner image, and write a compelling store description to attract more customers!
                </p>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                If you need any assistance getting started, our support team is here to help. Welcome to the ${this.fromName} family!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
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
        to: vendorEmail,
        subject: `🎉 Your Vendor Account is Approved - Start Selling Now! | ${this.fromName}`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Vendor approved email sent successfully to: ${vendorEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending vendor approved email:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      // Don't throw error to prevent approval process failure
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
      console.log('✅ Vendor Email service is ready and verified');
      console.log(`📧 From: "${this.fromName}" <${this.fromAddress}>`);
    } catch (error) {
      console.error('❌ Vendor Email service configuration error:', error);
    }
  }
}

export const vendorEmailService = new VendorEmailService();