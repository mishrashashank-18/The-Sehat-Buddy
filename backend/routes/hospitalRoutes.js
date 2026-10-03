import express from 'express';
import * as store from '../store.js';

const router = express.Router();

// GET all hospitals
router.get('/', (req, res) => {
  try {
    const hospitals = store.getHospitals();
    res.json({ success: true, data: hospitals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single hospital by ID
router.get('/:id', (req, res) => {
  try {
    const hospital = store.getHospitalById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({ success: true, data: hospital });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new hospital
router.post('/', (req, res) => {
  try {
    const { name, city } = req.body;
    if (!name || !city) {
      return res.status(400).json({ success: false, message: 'Name and city are required' });
    }
    const newHospital = store.addHospital(req.body);
    res.status(201).json({ success: true, data: newHospital, message: 'Hospital registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update hospital
router.put('/:id', (req, res) => {
  try {
    const updated = store.updateHospital(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({ success: true, data: updated, message: 'Hospital updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE hospital
router.delete('/:id', (req, res) => {
  try {
    const deleted = store.deleteHospital(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }
    res.json({ success: true, message: 'Hospital deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
