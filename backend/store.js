import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DOCTORS_FILE = path.join(DATA_DIR, 'doctors.json');
const HOSPITALS_FILE = path.join(DATA_DIR, 'hospitals.json');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers for reading and writing JSON
const readJSON = (filePath, fallback = []) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
};

const writeJSON = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
};

// DOCTORS CRUD
export const getDoctors = () => readJSON(DOCTORS_FILE, []);

export const getDoctorById = (id) => {
  const doctors = getDoctors();
  return doctors.find(d => String(d.id) === String(id));
};

export const addDoctor = (docData) => {
  const doctors = getDoctors();
  const newDoctor = {
    ...docData,
    id: Date.now(),
    rating: parseFloat(docData.rating) || 4.5,
    reviews: docData.reviews ? `${docData.reviews}` : '10+',
    price: parseInt(docData.price, 10) || 500
  };
  doctors.unshift(newDoctor);
  writeJSON(DOCTORS_FILE, doctors);
  return newDoctor;
};

export const updateDoctor = (id, updatedData) => {
  const doctors = getDoctors();
  const index = doctors.findIndex(d => String(d.id) === String(id));
  if (index === -1) return null;

  doctors[index] = {
    ...doctors[index],
    ...updatedData,
    rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) : doctors[index].rating,
    price: updatedData.price !== undefined ? parseInt(updatedData.price, 10) : doctors[index].price
  };
  writeJSON(DOCTORS_FILE, doctors);
  return doctors[index];
};

export const deleteDoctor = (id) => {
  const doctors = getDoctors();
  const filtered = doctors.filter(d => String(d.id) !== String(id));
  writeJSON(DOCTORS_FILE, filtered);
  return filtered.length !== doctors.length;
};

// HOSPITALS CRUD
export const getHospitals = () => readJSON(HOSPITALS_FILE, []);

export const getHospitalById = (id) => {
  const hospitals = getHospitals();
  return hospitals.find(h => String(h.id) === String(id));
};

export const addHospital = (hospData) => {
  const hospitals = getHospitals();
  const newHospital = {
    ...hospData,
    id: Date.now(),
    rating: parseFloat(hospData.rating) || 4.5,
    reviews: hospData.reviews ? `${hospData.reviews}` : '50+',
    totalBeds: parseInt(hospData.totalBeds, 10) || 100,
    emergency24x7: Boolean(hospData.emergency24x7),
    specialties: Array.isArray(hospData.specialties)
      ? hospData.specialties
      : (typeof hospData.specialties === 'string'
          ? hospData.specialties.split(',').map(s => s.trim()).filter(Boolean)
          : [])
  };
  hospitals.unshift(newHospital);
  writeJSON(HOSPITALS_FILE, hospitals);
  return newHospital;
};

export const updateHospital = (id, updatedData) => {
  const hospitals = getHospitals();
  const index = hospitals.findIndex(h => String(h.id) === String(id));
  if (index === -1) return null;

  hospitals[index] = {
    ...hospitals[index],
    ...updatedData,
    rating: updatedData.rating !== undefined ? parseFloat(updatedData.rating) : hospitals[index].rating,
    totalBeds: updatedData.totalBeds !== undefined ? parseInt(updatedData.totalBeds, 10) : hospitals[index].totalBeds,
    emergency24x7: updatedData.emergency24x7 !== undefined ? Boolean(updatedData.emergency24x7) : hospitals[index].emergency24x7
  };
  writeJSON(HOSPITALS_FILE, hospitals);
  return hospitals[index];
};

export const deleteHospital = (id) => {
  const hospitals = getHospitals();
  const filtered = hospitals.filter(h => String(h.id) !== String(id));
  writeJSON(HOSPITALS_FILE, filtered);
  return filtered.length !== hospitals.length;
};

// FRONT PAGE CONTENT CRUD
export const getContent = () => readJSON(CONTENT_FILE, {});

export const updateHeroContent = (heroData) => {
  const content = getContent();
  content.hero = { ...content.hero, ...heroData };
  writeJSON(CONTENT_FILE, content);
  return content.hero;
};

export const updateServices = (servicesList) => {
  const content = getContent();
  content.services = servicesList;
  writeJSON(CONTENT_FILE, content);
  return content.services;
};

export const updateFeatures = (featuresList) => {
  const content = getContent();
  content.features = featuresList;
  writeJSON(CONTENT_FILE, content);
  return content.features;
};

export const updateArticles = (articlesList) => {
  const content = getContent();
  content.articles = articlesList;
  writeJSON(CONTENT_FILE, content);
  return content.articles;
};

// STATS
export const getStats = () => {
  const doctors = getDoctors();
  const hospitals = getHospitals();
  return {
    totalDoctors: doctors.length,
    totalHospitals: hospitals.length,
    totalBeds: hospitals.reduce((sum, h) => sum + (parseInt(h.totalBeds, 10) || 0), 0),
    avgConsultation: doctors.length > 0
      ? Math.round(doctors.reduce((sum, d) => sum + (parseInt(d.price, 10) || 0), 0) / doctors.length)
      : 0,
    emergencyHospitals: hospitals.filter(h => h.emergency24x7).length
  };
};
