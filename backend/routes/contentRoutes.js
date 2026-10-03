import express from 'express';
import * as store from '../store.js';

const router = express.Router();

// GET all front-page content (hero, services, features, articles)
router.get('/', (req, res) => {
  try {
    const content = store.getContent();
    res.json({ success: true, data: content });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update hero section content
router.put('/hero', (req, res) => {
  try {
    const updatedHero = store.updateHeroContent(req.body);
    res.json({ success: true, data: updatedHero, message: 'Hero content updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update services list
router.put('/services', (req, res) => {
  try {
    const updatedServices = store.updateServices(req.body);
    res.json({ success: true, data: updatedServices, message: 'Services updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update features list
router.put('/features', (req, res) => {
  try {
    const updatedFeatures = store.updateFeatures(req.body);
    res.json({ success: true, data: updatedFeatures, message: 'Features updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update articles list
router.put('/articles', (req, res) => {
  try {
    const updatedArticles = store.updateArticles(req.body);
    res.json({ success: true, data: updatedArticles, message: 'Articles updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
