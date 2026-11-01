import mongoose from 'mongoose';

const phoneSubSchema = new mongoose.Schema({
  id: { type: String },
  label: { type: String, default: 'Helpline' },
  number: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const emailSubSchema = new mongoose.Schema({
  id: { type: String },
  label: { type: String, default: 'Support' },
  email: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

const contactSchema = new mongoose.Schema({
  topBadge: {
    type: String,
    default: 'Verified Healthcare Concierge'
  },
  statusBadge: {
    type: String,
    default: '24/7 Live Patient Support Active'
  },
  title: {
    type: String,
    default: "We're Here for You & Your Family"
  },
  subtitle: {
    type: String,
    default: "Reach our care coordinators directly for emergency hospital beds, specialist consults, or cashless insurance queries."
  },
  helplineLabel: {
    type: String,
    default: 'Helpline & Emergency'
  },
  helplineStatus: {
    type: String,
    default: '24x7 Active'
  },
  helphoneNumber: {
    type: String,
    default: '+91 98765 4321'
  },
  helplineNumber: {
    type: String,
    default: '+91 98765 4321'
  },
  helplineDesc: {
    type: String,
    default: 'Direct 24/7 hotline for critical triage, live ICU & inpatient bed reservations across accredited partner hospitals.'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80'
  },
  imagePublicId: {
    type: String,
    default: null
  },
  photoBadge: {
    type: String,
    default: '40+ Network Hospitals • Bengaluru Care Hub'
  },
  phones: [phoneSubSchema],
  emails: [emailSubSchema],
  workingHours: {
    type: String,
    default: 'Mon – Sat: 8:00 AM – 8:00 PM'
  },
  address: {
    type: String,
    default: ''
  },
  latitude: {
    type: Number,
    default: null
  },
  longitude: {
    type: Number,
    default: null
  }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
