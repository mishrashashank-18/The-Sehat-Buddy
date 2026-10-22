import { sendEmail } from './email.js';

/**
 * Generate a cryptographically robust temporary password meeting all complexity criteria:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special symbol (!@#$%&*)
 * - Length: ~10 chars
 */
export const generateTemporaryPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%&*';

  let pwd = '';
  pwd += upper.charAt(Math.floor(Math.random() * upper.length));
  pwd += lower.charAt(Math.floor(Math.random() * lower.length));
  pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));
  pwd += symbols.charAt(Math.floor(Math.random() * symbols.length));

  const all = upper + lower + numbers + symbols;
  for (let i = 0; i < 4; i++) {
    pwd += all.charAt(Math.floor(Math.random() * all.length));
  }

  return `Doc@${pwd}`;
};

/**
 * Send branded welcome email with temporary password to doctor
 */
export const sendDoctorWelcomeEmail = async ({ doctor, temporaryPassword, hospitalName }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const portalLoginUrl = `${clientUrl}/doctor`;
  const affiliatedHospital = hospitalName || doctor.hospital || 'The Sehat Buddy Network';

  try {
    await sendEmail({
      email: doctor.email,
      subject: `🩺 Welcome to Sehat Buddy — Doctor Clinical Portal Access Credentials`,
      message: `Hello ${doctor.name},\n\nYou have been registered on The Sehat Buddy clinical platform by ${affiliatedHospital}.\n\nYou can access your Doctor Portal using the following credentials:\n\nPortal URL: ${portalLoginUrl}\nLogin Email: ${doctor.email}\nTemporary Password: ${temporaryPassword}\n\nUpon logging in with this temporary password, you will be prompted to create your own permanent password.\n\nWarm regards,\nThe Sehat Buddy Clinical Operations Team`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">The Sehat Buddy</h1>
            <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.95;">Doctor Clinical Portal Onboarding</p>
          </div>
          <div style="padding: 32px 28px; color: #1e293b; line-height: 1.6;">
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #0f172a;">Welcome, ${doctor.name}!</h2>
            <p style="margin: 0 0 20px; font-size: 15px; color: #475569;">
              You have been registered as a healthcare practitioner affiliated with <strong>${affiliatedHospital}</strong> on <strong>The Sehat Buddy</strong>. You now have access to your clinical dashboard for managing appointments, patient consultations, prescriptions, and public profile details.
            </p>
            
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 20px; margin: 24px 0;">
              <h3 style="margin: 0 0 14px; font-size: 14px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">Your Temporary Login Credentials</h3>
              <div style="margin-bottom: 10px;">
                <span style="font-size: 13px; color: #64748b; display: block;">Doctor Portal URL:</span>
                <a href="${portalLoginUrl}" style="font-size: 14px; color: #2563eb; font-weight: 600; text-decoration: none;">${portalLoginUrl}</a>
              </div>
              <div style="margin-bottom: 10px;">
                <span style="font-size: 13px; color: #64748b; display: block;">Registered Email (Login ID):</span>
                <span style="font-size: 15px; color: #0f172a; font-weight: 600; font-family: monospace;">${doctor.email}</span>
              </div>
              <div>
                <span style="font-size: 13px; color: #64748b; display: block;">Temporary Password:</span>
                <span style="font-size: 17px; color: #dc2626; font-weight: 700; font-family: monospace; letter-spacing: 0.5px; background: #fee2e2; padding: 4px 10px; border-radius: 6px; display: inline-block;">${temporaryPassword}</span>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalLoginUrl}" style="background: #2563eb; color: #ffffff; padding: 13px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 15px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
                Sign In & Set Your Password &rarr;
              </a>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; font-size: 13px; color: #64748b;">
              <p style="margin: 0 0 8px;"><strong>Security Instructions:</strong> Enter this temporary password on the login screen to verify your email. You will then be prompted to create your own secure personal password.</p>
              <p style="margin: 0;">Need assistance? Contact our clinical support team at <a href="mailto:thesehatbuddy@gmail.com" style="color: #2563eb;">thesehatbuddy@gmail.com</a>.</p>
            </div>
          </div>
          <div style="background: #f1f5f9; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
            &copy; ${new Date().getFullYear()} The Sehat Buddy Healthcare Platform. All rights reserved.
          </div>
        </div>
      `
    });
    console.log(`✓ Welcome email with temporary password successfully sent to doctor: ${doctor.email}`);
  } catch (err) {
    console.error(`Failed to send welcome email to doctor ${doctor.email}:`, err.message);
  }
};
