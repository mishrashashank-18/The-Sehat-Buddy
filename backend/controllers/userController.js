import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import generateToken from '../utils/generateToken.js';
import { sendEmail } from '../utils/email.js';

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const user = await User.create({ name, email, password });
    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
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
      user.address = req.body.address ? JSON.parse(req.body.address) : user.address;
      user.dob = req.body.dob || user.dob;
      user.gender = req.body.gender || user.gender;
      
      if (req.file) {
        user.image = req.file.path;
      }
      
      const updatedUser = await user.save();
      res.json({ success: true, data: updatedUser });
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
    const appointment = await Appointment.findById(appointmentId);
    if (appointment.userId !== req.user.id) {
       return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    await Appointment.findByIdAndUpdate(appointmentId, { cancelled: true });

    // Release doctor slot
    const doctor = await Doctor.findById(appointment.docId);
    let slots_booked = doctor.slots_booked;
    slots_booked[appointment.slotDate] = slots_booked[appointment.slotDate].filter(e => e !== appointment.slotTime);
    await Doctor.findByIdAndUpdate(appointment.docId, { slots_booked });

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
        await user.save();
      }
    } else {
      // Create new user if they don't exist
      user = await User.create({
        name,
        email,
        googleId,
        image: picture || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg",
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
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
