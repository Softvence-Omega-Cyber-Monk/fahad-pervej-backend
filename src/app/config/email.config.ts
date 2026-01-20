import nodemailer, {Transporter} from 'nodemailer'
import { enVars } from './env'

export const createEmailTransporter = () : Transporter => {
    // Use MAIL_* variables (preferred) or fallback to SMTP_* variables
    const host = process.env.MAIL_HOST || enVars.EMAIL_SENDER.SMTP_HOST;
    const port = parseInt(process.env.MAIL_PORT || enVars.EMAIL_SENDER.SMTP_PORT || '587');
    const user = process.env.MAIL_USERNAME || enVars.EMAIL_SENDER.SMTP_USER;
    const pass = process.env.MAIL_PASSWORD || enVars.EMAIL_SENDER.SMTP_PASS;
    const encryption = process.env.MAIL_ENCRYPTION || 'tls';
    
    // secure is true for port 465, false for other ports (587 uses STARTTLS)
    const secure = port === 465;
    
    const transporter = nodemailer.createTransport({
        host: host as string,
        port: port,
        secure: secure,
        auth: {
            user: user as string,
            pass: pass as string
        },
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
    })
    
    transporter.verify((error, success) => {
        if(error){
            console.error('❌ Email configuration error:', error)
            console.error('Configuration:', {
                host,
                port,
                user,
                secure,
                encryption
            })
        } else {
            console.log("✅ Email server is ready")
            console.log(`📧 Email service configured: ${user} via ${host}:${port}`)
        }
    })
    
    return transporter
}