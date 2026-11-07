import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailLog from '../models/EmailLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Brevo SMTP transporter configuration
// Note: Transactional emails work best without socket pooling (pool: false).
// Persistent pooled sockets are dropped by Brevo and NAT firewalls after 30-60s of inactivity,
// causing subsequent email dispatches on idle connections to fail with 'Timeout'.
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // Port 587 uses STARTTLS
        auth: {
            user: process.env.BREVO_SMTP_USER || process.env.EMAIL_FROM,
            pass: process.env.BREVO_API_KEY,
        },
        connectionTimeout: 30000, // 30s connection timeout
        greetingTimeout: 30000,   // 30s greeting timeout
        socketTimeout: 45000      // 45s socket inactivity timeout
    });
};

const transporter = createTransporter();

// Verify credentials and SMTP accessibility on startup
transporter.verify((err) => {
    if (err) {
        console.warn('⚠️ Brevo SMTP verification warning:', err.message);
    } else {
        console.log('✓ Brevo SMTP relay connection verified and ready');
    }
});

/**
 * Send email using the pooled SMTP connection
 */
export const sendEmail = async (options) => {
    const mailOptions = {
        from: `The Sehat Buddy <${process.env.EMAIL_FROM}>`,
        to: options.email,
        replyTo: options.replyTo || options.reply_to || undefined,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    let lastError = null;

    // Attempt delivery up to 2 times to absorb transient SMTP hiccups
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const activeTransporter = attempt === 1 ? transporter : createTransporter();
            const info = await activeTransporter.sendMail(mailOptions);
            console.log('✓ Email delivered [%s]: %s (attempt %d)', options.email, info.messageId, attempt);

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
            lastError = error;
            console.warn(`Email attempt ${attempt} failed for ${options.email}: ${error.message}`);
            if (attempt === 1) {
                // Wait 1.5 seconds before retrying with a fresh transport
                await new Promise(res => setTimeout(res, 1500));
            }
        }
    }

    console.error('Error sending email to %s:', options.email, lastError?.message);

    EmailLog.create({
        to: options.email,
        subject: options.subject || 'Notification',
        status: 'failed',
        error: lastError?.message
    }).catch(logErr => {
        console.error('Failed to log failed email to DB:', logErr.message);
    });

    throw lastError;
};

/**
 * Fast asynchronous email dispatch (fire-and-forget, non-blocking)
 */
export const sendEmailFast = (options) => {
    sendEmail(options).catch(err => {
        console.warn('Background fast email dispatch failed:', err.message);
    });
};
