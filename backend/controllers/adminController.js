import Admin from '../models/Admin.js';
import generateToken from '../utils/generateToken.js';
import Doctor from '../models/Doctor.js';
import Hospital from '../models/Hospital.js';
import Appointment from '../models/Appointment.js';

export const authAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ success: false, message: 'Admin already exists' });
    }
    const admin = await Admin.create({ name, email, password });
    if (admin) {
      res.status(201).json({
        success: true,
        token: generateToken(admin._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid admin data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addDoctor = async (req, res) => {
  try {
    const { name, email, password, specialization, experience, about, fees, address } = req.body;
    let image = '';
    if (req.file) {
      image = req.file.path;
    }
    
    const doctor = await Doctor.create({
      name, email, password, specialization, experience, about, fees, address: JSON.parse(address), image
    });
    res.status(201).json({ success: true, message: 'Doctor added', data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const allDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}).select('-password');
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const doctorsCount = await Doctor.countDocuments();
    const hospitalsCount = await Hospital.countDocuments();
    const appointmentsCount = await Appointment.countDocuments();
    res.json({
      success: true,
      data: {
        doctors: doctorsCount,
        hospitals: hospitalsCount,
        appointments: appointmentsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
