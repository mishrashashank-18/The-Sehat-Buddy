import express from 'express';
import Content from '../models/Content.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const contents = await Content.find({});
    const data = contents.reduce((acc, curr) => {
      acc[curr.type] = curr.data;
      return acc;
    }, {});
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const content = await Content.findOneAndUpdate(
      { type }, 
      { data: req.body }, 
      { new: true, upsert: true }
    );
    res.json({ success: true, data: content, message: `${type} updated` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
