import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER || process.env.EMAIL_FROM,
        pass: process.env.BREVO_API_KEY,
    }
});

import EmailLog from '../models/EmailLog.js';

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
        console.log('Message sent: %s', info.messageId);

        try {
            await EmailLog.create({
                to: options.email,
                subject: options.subject || 'Notification',
                status: 'sent',
                messageId: info.messageId
            });
        } catch (logErr) {
            console.error('Failed to log email to DB:', logErr.message);
        }

        return info;
    } catch (error) {
        console.error('Error sending email:', error);

        try {
            await EmailLog.create({
                to: options.email,
                subject: options.subject || 'Notification',
                status: 'failed',
                error: error.message
            });
        } catch (logErr) {
            console.error('Failed to log failed email to DB:', logErr.message);
        }

        throw error;
    }
};
