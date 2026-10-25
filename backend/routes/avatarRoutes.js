import express from 'express';
import Avatar from '../models/Avatar.js';

const router = express.Router();

// @route   GET /api/avatars
// @desc    Get all preset doctor avatars
// @access  Public
router.get('/', async (req, res) => {
  try {
    let avatars = await Avatar.find().sort({ createdAt: 1 });
    // Fallback if collection was empty
    if (!avatars || avatars.length === 0) {
      avatars = [
        {
          key: 'male_doctor',
          label: 'Male Doctor Avatar',
          gender: 'male',
          url: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893957/sehatbuddy/avatars/default_doctor_male.png',
          localPath: '/avatars/avatar-male.png',
          isDefault: true
        },
        {
          key: 'female_doctor',
          label: 'Female Doctor Avatar',
          gender: 'female',
          url: 'https://res.cloudinary.com/nehlbmp2/image/upload/v1792893958/sehatbuddy/avatars/default_doctor_female.jpg',
          localPath: '/avatars/avatar-female.jpg',
          isDefault: true
        }
      ];
    }
    res.json({ success: true, count: avatars.length, data: avatars });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
