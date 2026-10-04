import Hospital from '../models/Hospital.js';
import generateToken from '../utils/generateToken.js';

export const authHospital = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hospital = await Hospital.findOne({ email });
    if (hospital && (await hospital.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(hospital._id),
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerHospital = async (req, res) => {
  const { name, email, password, address, city, state, zip, phone, description, specialities } = req.body;
  try {
    const hospitalExists = await Hospital.findOne({ email });
    if (hospitalExists) {
      return res.status(400).json({ success: false, message: 'Hospital already exists' });
    }
    
    let image = '';
    if (req.file) {
      image = req.file.path;
    }
    
    const hospital = await Hospital.create({ 
      name, email, password, address, city, state, zip, phone, description, 
      specialities: specialities ? JSON.parse(specialities) : [], image 
    });
    
    if (hospital) {
      res.status(201).json({
        success: true,
        token: generateToken(hospital._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid hospital data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).select('-password');
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).select('-password');
    if (hospital) {
      res.json({ success: true, data: hospital });
    } else {
      res.status(404).json({ success: false, message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
