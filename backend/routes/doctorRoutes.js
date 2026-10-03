import express from 'express';
import * as store from '../store.js';

const router = express.Router();

// GET all doctors
router.get('/', (req, res) => {
  try {
    const doctors = store.getDoctors();
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single doctor by ID
router.get('/:id', (req, res) => {
  try {
    const doctor = store.getDoctorById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new doctor
router.post('/', (req, res) => {
  try {
    const { name, specialty } = req.body;
    if (!name || !specialty) {
      return res.status(400).json({ success: false, message: 'Name and specialty are required' });
    }
    const newDoc = store.addDoctor(req.body);
    res.status(201).json({ success: true, data: newDoc, message: 'Doctor created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update doctor
router.put('/:id', (req, res) => {
  try {
    const updated = store.updateDoctor(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, data: updated, message: 'Doctor updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE doctor
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.deleteDoctor(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
