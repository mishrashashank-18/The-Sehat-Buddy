import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: 'CHANGEME_PENDING_SETUP' },
  specialization: { type: String, default: 'General Medicine' },
  experience: { type: Number, default: 5 },
  jobTitle: { type: String, default: 'Senior consultant' },
  about: { type: String },
  fees: { type: Number, default: 500 },
  image: { type: String },
  available: { type: Boolean, default: true },
  availabilityStatus: { type: String, enum: ['Available', 'Busy', 'On Leave'], default: 'Available' },
  address: {
    line1: { type: String },
    line2: { type: String },
  },
  hospital: { type: String },
  qualifications: { type: String },
  contact_number: { type: String },
  instagram: { type: String },
  facebook: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  reels: [{ type: String }],
  youtube_videos: [{ type: String }],
  rating: { type: Number, default: 4.8 },
  reviews: { type: String, default: '50+' },
  isStarDoctor: { type: Boolean, default: false },
  isFirstLogin: { type: Boolean, default: true },
  passwordSet: { type: Boolean, default: false },
  licenseNumber: { type: String, default: '' },
  awards: [{ type: String }],
  certifications: [{ type: String }],
  memberships: [{ type: String }],
  careerExperience: [{ type: String }],
  faqs: [{
    question: { type: String },
    answer: { type: String },
    q: { type: String },
    a: { type: String },
    steps: [{ type: String }],
    note: { type: String }
  }],
  otp: { type: String },
  otpExpires: { type: Date },
  date: { type: Number, default: Date.now },
  slots_booked: { type: Object, default: {} },
}, { timestamps: true, minimize: false });

doctorSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

doctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
