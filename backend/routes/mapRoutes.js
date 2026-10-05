import express from 'express';
import { getRoute } from '../controllers/mapController.js';

const router = express.Router();

// GET /api/maps/route?originLatitude=...&originLongitude=...&destinationLatitude=...&destinationLongitude=...
router.get('/route', getRoute);

export default router;
