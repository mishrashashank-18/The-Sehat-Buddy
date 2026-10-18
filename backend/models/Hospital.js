import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: 'CHANGEME_PENDING_SETUP', select: false },
  role: { type: String, default: 'hospital' },
  address: { type: String, default: 'Main Medical Campus' },
  city: { type: String, default: 'Delhi' },
  isFirstLogin: { type: Boolean, default: true },
  passwordSet: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  state: { type: String },
  zip: { type: String },
  phone: { type: String },
  image: { type: String },
  description: { type: String },
  specialities: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 4.8 },
  reviews: { type: String, default: '50+' },
  totalBeds: { type: Number, default: 100 },
  emergency24x7: { type: Boolean, default: true },
  establishedYear: { type: Number, default: 2000 },
  reels: [{ type: String }],
  youtube_videos: [{ type: String }],
  photos: [{
    url: { type: String, required: true },
    title: { type: String, default: '' },
    category: { type: String, enum: ['interior', 'exterior', 'facility', 'custom'], default: 'custom' },
    createdAt: { type: Date, default: Date.now }
  }],
  star_doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  staff_emails: [{ type: String }],
  staff_doctors: [{
    name: { type: String },
    email: { type: String, required: true }
  }],
  cashlessInsurance: { type: Boolean, default: true },
  acceptedInsurances: [{ type: String }],
  tpaHelpdesk: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    preAuthTime: { type: String, default: '30 Mins Cashless Pre-Approval' }
  },
  insuranceHelpline: { type: String, default: '1800-SEHAT-CARE' },
  latitude: { type: Number },
  longitude: { type: Number },
}, { timestamps: true });

hospitalSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

hospitalSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
