import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';
import validatePassword from '../utils/validatePassword.js';

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ success: false, message: passwordCheck.message });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      if (!userExists.isVerified) {
        // Resend OTP if not verified
        const otp = generateOTP();
        userExists.otp = otp;
        userExists.otpExpires = Date.now() + 10 * 60 * 1000;
        userExists.otpAttempts = 0;
        await userExists.save();
        
        try {
          await sendEmail({
            email: userExists.email,
            subject: 'Verify your email - Sehat Buddy',
            message: `Your OTP for registration is ${otp}. It is valid for 10 minutes.`,
            html: `<h4>Hello ${userExists.name},</h4><p>Your OTP for registration is <b>${otp}</b>. It is valid for 10 minutes.</p>`
          });
        } catch (emailError) {
          console.error('Error sending OTP email:', emailError.message);
        }
        
        return res.status(200).json({ success: true, requires_verification: true, message: 'OTP sent to email.' });
      }
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    const otp = generateOTP();
    const user = await User.create({
      name,
      email,
      password,
      role: 'user',
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      otpAttempts: 0
    });
    
    if (user) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Verify your email - Sehat Buddy',
          message: `Hello ${user.name},\n\nYour OTP for registration is ${otp}. It is valid for 10 minutes.`,
          html: `<h4>Hello ${user.name},</h4><p>Your OTP for registration is <b>${otp}</b>. It is valid for 10 minutes.</p>`
        });
      } catch (emailError) {
        console.error('Error sending OTP email:', emailError.message);
      }

      res.status(201).json({
        success: true,
        requires_verification: true,
        message: 'OTP sent to email.'
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email }).select('+otp +otpExpires +otpAttempts');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otpAttempts && user.otpAttempts >= 5) {
      user.otp = undefined;
      user.otpExpires = undefined;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Too many invalid attempts. This OTP has been invalidated for security. Please request a new OTP.'
      });
    }

    if (user.otp !== String(otp).trim() || user.otpExpires < Date.now()) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      const remaining = Math.max(0, 5 - user.otpAttempts);
      return res.status(400).json({
        success: false,
        message: `Invalid or expired OTP. ${remaining} attempt(s) remaining.`
      });
    }
    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.save();
    
    res.json({
      success: true,
      token: generateToken(user._id, 'user', user.tokenVersion || 0),
      user: { name: user.name, email: user.email, id: user._id }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: (email || '').toLowerCase().trim() }).select('+password +failedLoginAttempts +lockUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Account lockout check
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to repeated failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      });
    }

    if (await user.matchPassword(password)) {
      if (user.failedLoginAttempts > 0 || user.lockUntil) {
        user.failedLoginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      if (!user.isVerified) {
        const otp = generateOTP();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        user.otpAttempts = 0;
        await user.save();
        
        try {
          await sendEmail({
            email: user.email,
            subject: 'Verify your email - Sehat Buddy',
            message: `Hello ${user.name},\n\nYour OTP for login is ${otp}. It is valid for 10 minutes.`,
            html: `<h4>Hello ${user.name},</h4><p>Your OTP for login is <b>${otp}</b>. It is valid for 10 minutes.</p>`
          });
        } catch (emailError) {
          console.error('Error sending OTP email:', emailError.message);
        }
        
        return res.json({ success: true, requires_verification: true, message: 'OTP sent to email.' });
      }

      try {
        await sendEmail({
          email: user.email,
          subject: 'Login Alert - Sehat Buddy',
          message: `Hello ${user.name},\n\nA new login was detected on your Sehat Buddy account.`,
          html: `<h4>Hello ${user.name},</h4><p>A new login was detected on your Sehat Buddy account.</p>`
        });
      } catch (emailError) {
        console.error('Error sending login alert email:', emailError);
      }

      res.json({
        success: true,
        token: generateToken(user._id, 'user', user.tokenVersion || 0),
        user: { name: user.name, email: user.email, id: user._id }
      });
    } else {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.failedLoginAttempts = 0;
        await user.save();
        return res.status(423).json({
          success: false,
          message: 'Account locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      }
      await user.save();
      const remainingAttempts = Math.max(0, 5 - user.failedLoginAttempts);
      return res.status(401).json({
        success: false,
        message: `Invalid email or password. ${remainingAttempts} attempt(s) remaining before temporary lockout.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({ success: true, data: user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      if (req.body.address) {
        try {
          user.address = typeof req.body.address === 'string' ? JSON.parse(req.body.address) : req.body.address;
        } catch {
          user.address = req.body.address;
        }
      }
      user.dob = req.body.dob || user.dob;
      user.gender = req.body.gender || user.gender;
      
      if (req.file) {
        user.image = req.file.path;
      }
      
      const updatedUser = await user.save();
      const userObj = updatedUser.toObject();
      delete userObj.password;
      delete userObj.otp;
      delete userObj.otpExpires;
      delete userObj.otpAttempts;
      res.json({ success: true, data: userObj });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bookAppointment = async (req, res) => {
  const { docId, slotDate, slotTime } = req.body;
  try {
    const user = await User.findById(req.user.id).select('-password');
    const doctor = await Doctor.findById(docId).select('-password');
    
    if (!doctor || !user) {
      return res.status(404).json({ success: false, message: 'Doctor or User not found' });
    }

    let slots_booked = doctor.slots_booked || {};
    if (slots_booked[slotDate] && slots_booked[slotDate].includes(slotTime)) {
      return res.status(400).json({ success: false, message: 'Slot not available' });
    }

    if (!slots_booked[slotDate]) {
      slots_booked[slotDate] = [];
    }
    slots_booked[slotDate].push(slotTime);
    
    await Doctor.findByIdAndUpdate(docId, { slots_booked });
    
    const newAppointment = await Appointment.create({
      userId: req.user.id,
      docId,
      slotDate,
      slotTime,
      userData: user,
      docData: doctor,
      amount: doctor.fees,
      date: Date.now()
    });

    // Send email via Brevo
    try {
      await sendEmail({
        email: user.email,
        subject: 'Appointment Booked Successfully - Sehat Buddy',
        message: `Your appointment with Dr. ${doctor.name} is confirmed for ${slotDate} at ${slotTime}.`,
        html: `<h4>Hello ${user.name},</h4><p>Your appointment with Dr. ${doctor.name} is confirmed for ${slotDate} at ${slotTime}.</p>`
      });
    } catch (err) {
      console.log('Error sending email:', err.message);
    }

    res.json({ success: true, message: 'Appointment Booked', data: newAppointment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id });
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const appointmentId = req.body.appointmentId;
    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'Appointment ID is required' });
    }
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    if (appointment.userId?.toString() !== req.user.id?.toString()) {
       return res.status(403).json({ success: false, message: 'Forbidden: You can only cancel your own appointments' });
    }
    await Appointment.findByIdAndUpdate(appointmentId, { cancelled: true });

    // Release doctor slot
    const doctor = await Doctor.findById(appointment.docId);
    if (doctor && doctor.slots_booked && Array.isArray(doctor.slots_booked[appointment.slotDate])) {
      doctor.slots_booked[appointment.slotDate] = doctor.slots_booked[appointment.slotDate].filter(e => e !== appointment.slotTime);
      await Doctor.findByIdAndUpdate(appointment.docId, { slots_booked: doctor.slots_booked });
    }

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  const { idToken } = req.body;
  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const { email, name, sub: googleId, picture } = ticket.getPayload();
    
    let user = await User.findOne({ email });
    
    if (user) {
      // If user exists but no googleId, link the account
      if (!user.googleId) {
        user.googleId = googleId;
      }
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user if they don't exist
      user = await User.create({
        name,
        email,
        googleId,
        isVerified: true,
        image: picture || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      });
    }

    try {
      await sendEmail({
        email: user.email,
        subject: 'Login Alert - Sehat Buddy',
        message: `Hello ${user.name},\n\nA new Google login was detected on your Sehat Buddy account.`,
        html: `<h4>Hello ${user.name},</h4><p>A new Google login was detected on your Sehat Buddy account.</p>`
      });
    } catch (emailError) {
      console.error('Error sending login alert email:', emailError);
    }

    res.json({
      success: true,
      token: generateToken(user._id, 'user', user.tokenVersion || 0),
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, message: 'Google authentication failed' });
  }
};
