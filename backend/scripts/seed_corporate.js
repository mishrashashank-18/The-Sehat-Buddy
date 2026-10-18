import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Content from '../models/Content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const corporateTieups = [
  {
    id: 1,
    name: 'Tata Consultancy Services',
    shortName: 'TCS',
    category: 'IT & Consulting',
    benefit: 'Comprehensive Employee Wellness & Health Checks',
    color: '#0054A6',
    bgColor: '#EFF6FF',
    logoText: 'TCS',
    employeesCovered: '500,000+'
  },
  {
    id: 2,
    name: 'Infosys Limited',
    shortName: 'Infosys',
    category: 'Technology & Cloud',
    benefit: 'Executive Health Screening & Family Benefits',
    color: '#007CC3',
    bgColor: '#F0F9FF',
    logoText: 'INFY',
    employeesCovered: '300,000+'
  },
  {
    id: 3,
    name: 'Microsoft India',
    shortName: 'Microsoft',
    category: 'Software & Cloud',
    benefit: '24/7 Priority Hospital & Specialist Care',
    color: '#00A4EF',
    bgColor: '#EFF6FF',
    logoText: 'MSFT',
    employeesCovered: '20,000+'
  },
  {
    id: 4,
    name: 'Reliance Industries',
    shortName: 'Reliance',
    category: 'Conglomerate & Telecom',
    benefit: 'Nationwide Emergency Network & Surgeries',
    color: '#003366',
    bgColor: '#F1F5F9',
    logoText: 'RIL',
    employeesCovered: '350,000+'
  },
  {
    id: 5,
    name: 'Wipro Technologies',
    shortName: 'Wipro',
    category: 'Digital & Cyber',
    benefit: 'Preventive Diagnostics & Health Packages',
    color: '#8A2BE2',
    bgColor: '#F5F3FF',
    logoText: 'WIPRO',
    employeesCovered: '240,000+'
  },
  {
    id: 6,
    name: 'Deloitte India',
    shortName: 'Deloitte',
    category: 'Advisory & Audit',
    benefit: 'Annual Health Checkups & Mental Wellness',
    color: '#86BC25',
    bgColor: '#F7FEE7',
    logoText: 'Deloitte.',
    employeesCovered: '100,000+'
  },
  {
    id: 7,
    name: 'Amazon India',
    shortName: 'Amazon',
    category: 'E-Commerce & AWS',
    benefit: 'Priority Hospital Admission & Trauma Tie-up',
    color: '#FF9900',
    bgColor: '#FFFBEB',
    logoText: 'amazon',
    employeesCovered: '120,000+'
  },
  {
    id: 8,
    name: 'Accenture Solutions',
    shortName: 'Accenture',
    category: 'Consulting & Strategy',
    benefit: 'Specialist Doctor Consultations & Telehealth',
    color: '#A100FF',
    bgColor: '#FAF5FF',
    logoText: '>accenture',
    employeesCovered: '280,000+'
  },
  {
    id: 9,
    name: 'Mahindra & Mahindra',
    shortName: 'Mahindra',
    category: 'Automotive & Industrial',
    benefit: 'Occupational Health & On-Site Medical Rooms',
    color: '#E31837',
    bgColor: '#FEF2F2',
    logoText: 'Mahindra',
    employeesCovered: '150,000+'
  },
  {
    id: 10,
    name: 'ICICI Bank',
    shortName: 'ICICI Bank',
    category: 'Banking & Finance',
    benefit: 'Group Health Coverage & Cashless Hospitalization',
    color: '#F37021',
    bgColor: '#FFF7ED',
    logoText: 'ICICI',
    employeesCovered: '130,000+'
  }
];

async function seedCorporate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding Corporate Tie-ups...');

    await Content.findOneAndUpdate(
      { type: 'corporate' },
      { data: corporateTieups },
      { new: true, upsert: true }
    );

    // Also remove the temporary test content if present
    await Content.deleteOne({ type: 'test' });

    console.log(`Successfully seeded ${corporateTieups.length} corporate tie-ups into MongoDB Atlas!`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding corporate tie-ups:', err);
    process.exit(1);
  }
}

seedCorporate();
