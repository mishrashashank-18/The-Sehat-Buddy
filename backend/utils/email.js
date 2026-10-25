import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailLog from '../models/EmailLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// High-performance pooled SMTP transporter (keeps connections open & reused to avoid TLS handshake on every mail)
const transporter = nodemailer.createTransport({
    pool: true,
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER || process.env.EMAIL_FROM,
        pass: process.env.BREVO_API_KEY,
    },
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14,
    socketTimeout: 30000,
    greetingTimeout: 10000,
    dnsTimeout: 5000
});

// Pre-warm the SMTP connection pool on startup
transporter.verify((err) => {
    if (err) {
        console.warn('⚠️ SMTP pool pre-warm notice:', err.message);
    } else {
        console.log('✓ Brevo SMTP connection pool ready (high-speed pooled mode active)');
    }
});

/**
 * Send email using the pooled SMTP connection
 */
export const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: `Sehat Buddy <${process.env.EMAIL_FROM}>`,
            to: options.email,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✓ Fast email sent [%s]: %s', options.email, info.messageId);

        // Log to database asynchronously without blocking the email response
        EmailLog.create({
            to: options.email,
            subject: options.subject || 'Notification',
            status: 'sent',
            messageId: info.messageId
        }).catch(logErr => {
            console.error('Failed to log email to DB:', logErr.message);
        });

        return info;
    } catch (error) {
        console.error('Error sending email to %s:', options.email, error.message);

        EmailLog.create({
            to: options.email,
            subject: options.subject || 'Notification',
            status: 'failed',
            error: error.message
        }).catch(logErr => {
            console.error('Failed to log failed email to DB:', logErr.message);
        });

        throw error;
    }
};

/**
 * Fast asynchronous email dispatch (fire-and-forget, non-blocking)
 */
export const sendEmailFast = (options) => {
    sendEmail(options).catch(err => {
        console.warn('Background fast email dispatch failed:', err.message);
    });
};
