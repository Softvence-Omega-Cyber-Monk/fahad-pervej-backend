import nodemailer from 'nodemailer';
import { IOrder, OrderStatus } from '../order/order.interface';

interface IEmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface IVendorOrderEmailData {
  vendorEmail: string;
  vendorName: string;
  order: any;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
}

export class EmailService {
  /**
   * Send order cancellation email to customer
   */
  async sendOrderCancellationEmail(
    customerEmail: string,
    customerName: string,
    order: IOrder,
    reason?: string
  ): Promise<void> {
    try {
      console.log(`📧 Attempting to send cancellation email to customer: ${customerEmail}`);

      // Validate email address
      if (!customerEmail || !this.isValidEmail(customerEmail)) {
        console.error(`❌ Invalid customer email address: ${customerEmail}`);
        throw new Error(`Invalid customer email address: ${customerEmail}`);
      }

      const reasonSection = reason ? `
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #fff3e0; padding: 15px; border-radius: 6px; border-left: 4px solid #FF9800;">
                <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #333;">Cancellation Reason</h3>
                <p style="margin: 0; font-size: 14px; color: #666;">${reason}</p>
              </div>
            </td>
          </tr>
      ` : '';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #F44336; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">❌ Order Cancelled</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hello <strong>${customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Your order has been successfully cancelled. If you believe this was a mistake or have any questions, please contact our support team.
              </p>
            </td>
          </tr>

          <!-- Cancellation Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid #F44336;">
                <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Cancellation Details</h2>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Number:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Status:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">
                      <span style="background-color: #F44336; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                        CANCELLED
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Cancelled On:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Refund Information -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Refund Information</h2>
              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 6px;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Total:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.grandTotal.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Refund Amount:</td>
                    <td style="color: #2e7d32; font-weight: bold; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.grandTotal.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="color: #666; font-size: 12px; padding-top: 10px; border-top: 1px solid #ddd;">
                      <em>The refund has been processed and should appear in your account within 3-5 business days depending on your payment method.</em>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          ${reasonSection}

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Order Summary</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Date:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Subtotal:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.totalPrice.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Shipping Fee:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.shippingFee.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Tax:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.tax.toFixed(3)}</td>
                  </tr>
                  ${order.discount > 0 ? `
                  <tr>
                    <td style="color: #666; font-size: 14px;">Discount:</td>
                    <td style="color: #4CAF50; font-size: 14px; text-align: right;">- ${order.baseCurrency} ${order.discount.toFixed(3)}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 2px solid #ddd;">
                    <td style="color: #333; font-size: 18px; font-weight: bold; padding-top: 10px;">Grand Total:</td>
                    <td style="color: #F44336; font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px;">${order.baseCurrency} ${order.grandTotal.toFixed(3)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Help Section -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
                <p style="margin: 0; font-size: 14px; color: #1565c0;">
                  <strong>Questions?</strong> If you have any concerns about this cancellation or would like to place a new order, please contact our support team.
                </p>
              </div>
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
        to: customerEmail,
        subject: `Order Cancelled - ${order.orderNumber}`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Cancellation email sent successfully to customer: ${customerEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending cancellation email:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      // Don't throw error to prevent order cancellation failure
    }
  }

  async sendOrderStatusUpdateEmail(
    customerEmail: string,
    customerName: string,
    order: IOrder,
    previousStatus: OrderStatus,
    newStatus: OrderStatus
  ): Promise<void> {
    try {
      console.log(`📧 Attempting to send status update email to customer: ${customerEmail}`);

      // Validate email address
      if (!customerEmail || !this.isValidEmail(customerEmail)) {
        console.error(`❌ Invalid customer email address: ${customerEmail}`);
        throw new Error(`Invalid customer email address: ${customerEmail}`);
      }

      // Get status-specific message and color
      const statusConfig: { [key in OrderStatus]: { message: string; color: string; icon: string } } = {
        [OrderStatus.PENDING]: {
          message: 'Your order has been received and is pending confirmation.',
          color: '#FFC107',
          icon: '⏳'
        },
        [OrderStatus.CONFIRMED]: {
          message: 'Great! Your order has been confirmed and will be prepared for shipment soon.',
          color: '#2196F3',
          icon: '✓'
        },
        [OrderStatus.PREPARING_FOR_SHIPMENT]: {
          message: 'Your order is being carefully prepared and will be shipped very soon.',
          color: '#FF9800',
          icon: '📦'
        },
        [OrderStatus.OUT_FOR_DELIVERY]: {
          message: 'Your order is on its way! It should arrive soon.',
          color: '#4CAF50',
          icon: '🚚'
        },
        [OrderStatus.DELIVERED]: {
          message: 'Your order has been delivered! We hope you enjoy your purchase.',
          color: '#4CAF50',
          icon: '✅'
        },
        [OrderStatus.CANCELLED]: {
          message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
          color: '#F44336',
          icon: '❌'
        }
      };

      const statusInfo = statusConfig[newStatus];
      const trackingInfo = order.trackingNumber
        ? `<tr><td style="color: #666; font-size: 14px;">Tracking Number:</td><td style="color: #333; font-size: 14px; text-align: right;"><strong>${order.trackingNumber}</strong></td></tr>`
        : '';

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with Status Color -->
          <tr>
            <td style="background-color: ${statusInfo.color}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${statusInfo.icon} Order Status Updated</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hello <strong>${customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                ${statusInfo.message}
              </p>
            </td>
          </tr>

          <!-- Status Change Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid ${statusInfo.color};">
                <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Status Details</h2>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Number:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Previous Status:</td>
                    <td style="color: #999; font-size: 14px; text-align: right;">${previousStatus}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Current Status:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">
                      <span style="background-color: ${statusInfo.color}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                        ${newStatus}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Updated On:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</td>
                  </tr>
                  ${trackingInfo}
                </table>
              </div>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Order Summary</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Date:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Subtotal:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.totalPrice.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Shipping Fee:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.shippingFee.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Tax:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${order.baseCurrency} ${order.tax.toFixed(3)}</td>
                  </tr>
                  ${order.discount > 0 ? `
                  <tr>
                    <td style="color: #666; font-size: 14px;">Discount:</td>
                    <td style="color: #4CAF50; font-size: 14px; text-align: right;">- ${order.baseCurrency} ${order.discount.toFixed(3)}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 2px solid #ddd;">
                    <td style="color: #333; font-size: 18px; font-weight: bold; padding-top: 10px;">Grand Total:</td>
                    <td style="color: ${statusInfo.color}; font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px;">${order.baseCurrency} ${order.grandTotal.toFixed(3)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Shipping Address</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;"><strong>${order.shippingAddress.fullName}</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.shippingAddress.addressSpecific}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.shippingAddress.country}</p>
                <p style="margin: 0; font-size: 14px; color: #666;">Phone: ${order.shippingAddress.mobileNumber}</p>
              </div>
            </td>
          </tr>

          <!-- Help Section -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
                <p style="margin: 0; font-size: 14px; color: #1565c0;">
                  <strong>Need Help?</strong> If you have any questions about your order, please don't hesitate to contact our support team.
                </p>
              </div>
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
        to: customerEmail,
        subject: `Order Status Update - ${order.orderNumber} is now ${newStatus}`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Status update email sent successfully to customer: ${customerEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending status update email:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      // Don't throw error to prevent order status update failure
    }
  }
  private transporter: nodemailer.Transporter;
  private fromAddress: string;
  private fromName: string;

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

    const config: IEmailConfig = {
      host: host,
      port: port,
      secure: port === 465, // true for 465, false for other ports (587 uses STARTTLS)
      auth: {
        user: user,
        pass: pass
      }
    };

    // Add additional options for better compatibility
    const transportConfig: any = {
      ...config,
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
        ciphers: 'SSLv3' // For compatibility with some SMTP servers
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
      socketTimeout: 10000,
      requireTLS: encryption === 'tls', // Force TLS if specified
      debug: process.env.NODE_ENV !== 'production', // Enable debug in development
      logger: process.env.NODE_ENV !== 'production' // Enable logger in development
    };

    this.transporter = nodemailer.createTransport(transportConfig);

    // Test connection on initialization
    this.testConnection().then(success => {
      if (success) {
        console.log('✅ Email service initialized successfully');
        console.log(`📧 From: "${this.fromName}" <${this.fromAddress}>`);
        console.log(`📧 SMTP: ${user} via ${host}:${port} (${encryption})`);
      } else {
        console.error('❌ Email service initialization failed');
      }
    });
  }

  /**
   * Send order notification email to vendor
   */
  async sendVendorOrderNotification(data: IVendorOrderEmailData): Promise<void> {
    try {
      console.log(`📧 Attempting to send email to vendor: ${data.vendorEmail}`);

      const { vendorEmail, vendorName, order, products } = data;

      // Validate email address
      if (!vendorEmail || !this.isValidEmail(vendorEmail)) {
        console.error(`❌ Invalid vendor email address: ${vendorEmail}`);
        throw new Error(`Invalid vendor email address: ${vendorEmail}`);
      }

      const productRows = products
        .map(
          (product) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${product.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">BHD ${product.price.toFixed(3)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">BHD ${product.total.toFixed(3)}</td>
        </tr>
      `
        )
        .join('');

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #4CAF50; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">New Order Received!</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hello <strong>${vendorName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                You have received a new order. Please review the details below and prepare for shipment.
              </p>
            </td>
          </tr>

          <!-- Order Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid #4CAF50;">
                <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Order Information</h2>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Number:</td>
                    <td style="color: #333; font-weight: bold; font-size: 14px; text-align: right;">${order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Date:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">${new Date(order.createdAt).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Order Status:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">
                      <span style="background-color: #2196F3; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">
                        ${order.status}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Shipping Address</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #333;"><strong>${order.shippingAddress.fullName}</strong></p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.shippingAddress.addressSpecific}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${order.shippingAddress.country}</p>
                <p style="margin: 0; font-size: 14px; color: #666;">Phone: ${order.shippingAddress.mobileNumber}</p>
              </div>
            </td>
          </tr>

          <!-- Products Table -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #eee; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 12px 10px; text-align: left; font-size: 14px; color: #666; font-weight: 600;">Product</th>
                    <th style="padding: 12px 10px; text-align: center; font-size: 14px; color: #666; font-weight: 600;">Qty</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 14px; color: #666; font-weight: 600;">Price</th>
                    <th style="padding: 12px 10px; text-align: right; font-size: 14px; color: #666; font-weight: 600;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 6px;">
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; font-size: 14px;">Subtotal:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">BHD ${order.totalPrice.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Shipping Fee:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">BHD ${order.shippingFee.toFixed(3)}</td>
                  </tr>
                  <tr>
                    <td style="color: #666; font-size: 14px;">Tax:</td>
                    <td style="color: #333; font-size: 14px; text-align: right;">BHD ${order.tax.toFixed(3)}</td>
                  </tr>
                  ${order.discount > 0 ? `
                  <tr>
                    <td style="color: #666; font-size: 14px;">Discount:</td>
                    <td style="color: #4CAF50; font-size: 14px; text-align: right;">- BHD ${order.discount.toFixed(3)}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 2px solid #ddd;">
                    <td style="color: #333; font-size: 18px; font-weight: bold; padding-top: 10px;">Grand Total:</td>
                    <td style="color: #4CAF50; font-size: 18px; font-weight: bold; text-align: right; padding-top: 10px;">BHD ${order.grandTotal.toFixed(3)}</td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          ${order.orderNotes ? `
          <!-- Order Notes -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333;">Customer Notes</h2>
              <div style="background-color: #fff9e6; padding: 15px; border-radius: 6px; border-left: 4px solid #FFC107;">
                <p style="margin: 0; font-size: 14px; color: #666; font-style: italic;">"${order.orderNotes}"</p>
              </div>
            </td>
          </tr>
          ` : ''}
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
        subject: `New Order Received - ${order.orderNumber}`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Order notification email sent successfully to vendor: ${vendorEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending vendor order notification email:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error(`Failed to send vendor notification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send order confirmation email to customer
   */
  async sendCustomerOrderConfirmation(customerEmail: string, customerName: string, order: IOrder): Promise<void> {
    try {
      console.log(`📧 Attempting to send confirmation email to customer: ${customerEmail}`);

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
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #4CAF50; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Order Confirmed!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px;">Dear ${customerName},</p>
              <p style="margin: 0 0 20px 0; font-size: 16px;">Thank you for your order! Your order <strong>${order.orderNumber}</strong> has been confirmed and is being processed.</p>
              <p style="margin: 0; font-size: 16px;">Order Total: <strong>BHD ${order.grandTotal.toFixed(3)}</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 30px; background-color: #f9f9f9; border-top: 1px solid #eee;">
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
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: emailHtml
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Order confirmation email sent successfully to customer: ${customerEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
    } catch (error) {
      console.error('❌ Error sending customer order confirmation email:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      // Don't throw error to prevent order creation failure
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
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready and verified');
      return true;
    } catch (error) {
      console.error('❌ Email service configuration error:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          name: error.name
        });
      }
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    try {
      console.log(`📧 Sending test email to: ${to}`);

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromAddress}>`,
        to: to,
        subject: 'Test Email - Email Service Working',
        html: '<h1>Test Email</h1><p>If you receive this email, your email service is working correctly!</p>'
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent successfully! Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return false;
    }
  }

}

export const emailService = new EmailService();