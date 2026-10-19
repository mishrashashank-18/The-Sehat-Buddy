import Subscriber from '../models/Subscriber.js';
import { sendEmail } from '../utils/email.js';
import { broadcastDbChange } from '../services/storageMonitor.js';

export const subscribeNewsletter = async (req, res) => {
  try {
    const { email, source = 'newsletter', featureInterest = null } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})*(\.[a-zA-Z]{2,})+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address format.' });
    }

    // Check if subscriber already exists
    let subscriber = await Subscriber.findOne({ email: cleanEmail });
    let isNewSubscriber = false;

    if (!subscriber) {
      subscriber = await Subscriber.create({
        email: cleanEmail,
        source: source === 'coming-soon' ? 'coming-soon' : 'newsletter',
        featureInterest: featureInterest || null,
        status: 'subscribed'
      });
      isNewSubscriber = true;
    } else {
      // Re-activate if was unsubscribed
      if (subscriber.status === 'unsubscribed') {
        subscriber.status = 'subscribed';
      }
      if (source) subscriber.source = source;
      if (featureInterest) subscriber.featureInterest = featureInterest;
      await subscriber.save();
    }

    // Format customized email HTML
    const featureNameMap = {
      'lab-tests': 'Lab Tests & Diagnostic Health Packages',
      'surgeries': 'Advanced Surgeries & Daycare Procedures',
      'senior-care': 'Senior & Elder Companion Care',
      'women-care': 'Women’s Health & Wellness',
      'kid-care': 'Pediatric & Child Wellness'
    };

    const specificFeature = featureInterest ? featureNameMap[featureInterest] || featureInterest : null;

    const emailSubject = specificFeature
      ? `You're on the priority list for ${specificFeature}! 🩺 - Sehat Buddy`
      : 'Welcome to Sehat Buddy Health Newsletter! 🩺';

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${emailSubject}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { background: linear-gradient(135deg, #0054a6 0%, #0284c7 100%); padding: 36px 30px; text-align: center; color: #ffffff; }
          .logo-text { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
          .logo-sub { font-size: 13px; opacity: 0.9; margin-top: 4px; font-weight: 500; }
          .content { padding: 32px 30px; }
          .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px; }
          .lead-p { font-size: 15px; color: #334155; line-height: 1.6; margin-bottom: 20px; }
          .highlight-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
          .highlight-title { font-weight: 700; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .highlight-list { margin: 0; padding-left: 20px; color: #14532d; font-size: 14px; }
          .highlight-list li { margin-bottom: 6px; }
          .cta-row { text-align: center; margin: 30px 0 10px; }
          .cta-btn { display: inline-block; background: #0054a6; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 12px 28px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,84,166,0.25); }
          .footer { background: #f1f5f9; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .footer p { margin: 4px 0; }
          .footer a { color: #0054a6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo-text">The Sehat Buddy 🩺</h1>
            <div class="logo-sub">Your Trusted Healthcare Partner & Navigator</div>
          </div>
          
          <div class="content">
            <h2 class="greeting">Thank you for subscribing!</h2>
            <p class="lead-p">
              We're thrilled to have you join our wellness community. You are now officially subscribed to <strong>The Sehat Buddy Health Newsletter</strong> with <em>${cleanEmail}</em>.
            </p>

            ${specificFeature ? `
              <div class="highlight-box" style="background: #eff6ff; border-color: #bfdbfe;">
                <div class="highlight-title" style="color: #1e40af;">🚀 Priority Launch Access: ${specificFeature}</div>
                <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
                  We have noted your interest in <strong>${specificFeature}</strong>. You will be among the very first to receive an exclusive early-access invitation and special launch benefits as soon as it goes live!
                </p>
              </div>
            ` : ''}

            <div class="highlight-box">
              <div class="highlight-title">Here is what you will receive:</div>
              <ul class="highlight-list">
                <li><strong>Verified Doctor Advice:</strong> Actionable health tips from accredited medical specialists.</li>
                <li><strong>Hospital Offers:</strong> Exclusive discounts on preventive checkups and surgical consultations.</li>
                <li><strong>Healthy Living Guides:</strong> Nutrition plans, chronic disease management, and wellness routines.</li>
                <li><strong>New Features:</strong> Early bird access to home diagnostics, tele-consults, and medication delivery.</li>
              </ul>
            </div>

            <div class="cta-row">
              <a href="http://localhost:5173" class="cta-btn">Explore Live Healthcare Services</a>
            </div>
          </div>

          <div class="footer">
            <p><strong>The Sehat Buddy Healthcare Platform</strong></p>
            <p>Sent with care via Brevo SMTP Relay &bull; support: <a href="mailto:thesehatbuddy@gmail.com">thesehatbuddy@gmail.com</a></p>
            <p>You received this email because you subscribed on our website. If this was a mistake, you can ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailText = `Hello,\n\nThank you for subscribing to The Sehat Buddy Health Newsletter!\n\nYou're on our priority list for verified doctor insights, hospital packages, and preventive health tips.\n\nBest regards,\nThe Sehat Buddy Team\nSupport: thesehatbuddy@gmail.com`;

    // Send confirmation email via Brevo
    try {
      await sendEmail({
        email: cleanEmail,
        subject: emailSubject,
        message: emailText,
        html: emailHtml
      });

      subscriber.welcomeEmailSent = true;
      subscriber.welcomeEmailSentAt = new Date();
      await subscriber.save();
    } catch (emailErr) {
      console.error('Failed to send Brevo welcome email:', emailErr.message);
      // Even if email delivery fails, subscriber is stored in DB
    }

    try {
      broadcastDbChange('subscribers', isNewSubscriber ? 'insert' : 'update', subscriber._id, subscriber);
    } catch {}

    return res.status(200).json({
      success: true,
      message: 'Subscription successful! A welcome confirmation email has been dispatched via Brevo to your inbox.',
      data: {
        email: subscriber.email,
        source: subscriber.source,
        welcomeEmailSent: subscriber.welcomeEmailSent
      }
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Subscription failed. Please try again later.' });
  }
};

export const listSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    return res.json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
