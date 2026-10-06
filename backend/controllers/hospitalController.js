import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';
import generateToken from '../utils/generateToken.js';

export const authHospital = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hospital = await Hospital.findOne({ email });
    if (hospital && (await hospital.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(hospital._id),
        user: hospital
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper to ensure doctor staff accounts exist and are linked to hospital
 */
const syncHospitalStaff = async (hospitalName, staffList, hospitalId) => {
  if (!Array.isArray(staffList) || staffList.length === 0) return;

  for (const staffItem of staffList) {
    let cleanEmail = '';
    let doctorName = '';

    if (typeof staffItem === 'string') {
      cleanEmail = staffItem.toLowerCase().trim();
    } else if (staffItem && typeof staffItem === 'object') {
      cleanEmail = (staffItem.email || '').toLowerCase().trim();
      doctorName = (staffItem.name || '').trim();
    }

    if (!cleanEmail) continue;

    const existingDoctor = await Doctor.findOne({ email: cleanEmail });
    if (!existingDoctor) {
      let formattedName = doctorName;
      if (!formattedName) {
        const namePart = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
        formattedName = 'Dr. ' + namePart.charAt(0).toUpperCase() + namePart.slice(1);
      } else if (!formattedName.toLowerCase().startsWith('dr.') && !formattedName.toLowerCase().startsWith('dr ')) {
        formattedName = 'Dr. ' + formattedName;
      }
      
      await Doctor.create({
        name: formattedName,
        email: cleanEmail,
        password: 'CHANGEME_PENDING_SETUP',
        specialization: 'General Physician',
        experience: 5,
        fees: 500,
        hospital: hospitalName,
        isFirstLogin: true,
        passwordSet: false,
        about: `Clinical specialist affiliated with ${hospitalName}.`
      });
    } else {
      let needsSave = false;
      if (!existingDoctor.hospital) {
        existingDoctor.hospital = hospitalName;
        needsSave = true;
      }
      // If doctor didn't have a customized name yet and a name is provided, update it
      if (doctorName && (!existingDoctor.name || existingDoctor.name.toLowerCase().includes(cleanEmail.split('@')[0]))) {
        let formattedName = doctorName;
        if (!formattedName.toLowerCase().startsWith('dr.') && !formattedName.toLowerCase().startsWith('dr ')) {
          formattedName = 'Dr. ' + formattedName;
        }
        existingDoctor.name = formattedName;
        needsSave = true;
      }
      if (needsSave) {
        await existingDoctor.save();
      }
    }
  }
};

export const registerHospital = async (req, res) => {
  const { name, email, password, address, city, state, zip, phone, description, specialities, rating, reviews, totalBeds, emergency24x7, establishedYear, reels, youtube_videos, star_doctors, staff_emails, latitude, longitude } = req.body;
  try {
    const hospitalExists = await Hospital.findOne({ email });
    if (hospitalExists) {
      return res.status(400).json({ success: false, message: 'Hospital already exists' });
    }
    
    let image = req.body.image || '';
    if (req.file) {
      image = req.file.path;
    }
    
    let parsedSpecialities = [];
    if (specialities) {
      parsedSpecialities = typeof specialities === 'string' ? JSON.parse(specialities) : specialities;
    }

    let parsedStaffEmails = [];
    if (staff_emails) {
      parsedStaffEmails = Array.isArray(staff_emails)
        ? staff_emails.map(e => e.trim().toLowerCase()).filter(Boolean)
        : String(staff_emails).split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    }

    let parsedStaffDoctors = [];
    if (req.body.staff_doctors) {
      parsedStaffDoctors = Array.isArray(req.body.staff_doctors) ? req.body.staff_doctors : [];
    }

    const hospital = await Hospital.create({ 
      name, email, password: password || 'password123', address, city, state, zip, phone, description, 
      specialities: parsedSpecialities, image,
      rating: rating || 4.5,
      reviews: reviews || '50+',
      totalBeds: totalBeds || 100,
      emergency24x7: emergency24x7 !== undefined ? emergency24x7 : true,
      establishedYear,
      reels: reels || [],
      youtube_videos: youtube_videos || [],
      star_doctors: star_doctors || [],
      staff_emails: parsedStaffEmails,
      staff_doctors: parsedStaffDoctors,
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined
    });
    
    if (hospital) {
      // Sync staff doctors created with this hospital
      const combinedStaff = [
        ...parsedStaffDoctors,
        ...parsedStaffEmails.map(e => ({ email: e }))
      ];
      if (combinedStaff.length > 0) {
        await syncHospitalStaff(hospital.name, combinedStaff, hospital._id);
      }

      res.status(201).json({
        success: true,
        token: generateToken(hospital._id),
        data: hospital
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
    const hospitals = await Hospital.find({}).select('-password').populate('star_doctors', '-password');
    res.json({ success: true, data: hospitals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id).select('-password').populate('star_doctors', '-password');
    if (hospital) {
      res.json({ success: true, data: hospital });
    } else {
      res.status(404).json({ success: false, message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (hospital) {
      Object.assign(hospital, req.body);
      if (req.body.specialities !== undefined) {
        hospital.specialities = req.body.specialities;
        hospital.markModified('specialities');
      }
      if (req.body.reels !== undefined) {
        hospital.reels = Array.isArray(req.body.reels) ? req.body.reels : [];
        hospital.markModified('reels');
      }
      if (req.body.youtube_videos !== undefined) {
        hospital.youtube_videos = Array.isArray(req.body.youtube_videos) ? req.body.youtube_videos : [];
        hospital.markModified('youtube_videos');
      }
      if (req.body.star_doctors !== undefined) {
        hospital.star_doctors = Array.isArray(req.body.star_doctors) ? req.body.star_doctors : [];
        hospital.markModified('star_doctors');
      }
      if (req.body.photos !== undefined) {
        hospital.photos = Array.isArray(req.body.photos) ? req.body.photos : [];
        hospital.markModified('photos');
      }
      if (req.body.staff_doctors !== undefined) {
        hospital.staff_doctors = Array.isArray(req.body.staff_doctors)
          ? req.body.staff_doctors
          : [];
        hospital.markModified('staff_doctors');
      }
      if (req.body.staff_emails !== undefined) {
        hospital.staff_emails = Array.isArray(req.body.staff_emails) 
          ? req.body.staff_emails.map(e => e.trim().toLowerCase()).filter(Boolean)
          : String(req.body.staff_emails).split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        hospital.markModified('staff_emails');
      }
      if (req.file) {
        hospital.image = req.file.path;
      } else if (req.body.image) {
        hospital.image = req.body.image;
      }
      const updatedHospital = await hospital.save();

      // Sync any new staff doctors & emails
      const combinedStaff = [
        ...(hospital.staff_doctors || []),
        ...(hospital.staff_emails || []).map(e => ({ email: e }))
      ];
      if (combinedStaff.length > 0) {
        await syncHospitalStaff(updatedHospital.name, combinedStaff, updatedHospital._id);
      }

      const populated = await Hospital.findById(updatedHospital._id).select('-password').populate('star_doctors', '-password');
      res.json({ success: true, message: 'Hospital updated', data: populated || updatedHospital });
    } else {
      res.status(404).json({ success: false, message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (hospital) {
      await hospital.deleteOne();
      res.json({ success: true, message: 'Hospital deleted' });
    } else {
      res.status(404).json({ success: false, message: 'Hospital not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
