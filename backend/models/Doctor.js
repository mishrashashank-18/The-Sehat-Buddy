import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const doctorSchema = new mongoose.Schema({
  id: { type: String, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, default: 'CHANGEME_PENDING_SETUP', select: false },
  role: { type: String, default: 'doctor' },
  specialization: { type: String, default: 'General Medicine' },
  specialty: { type: String, default: 'General Medicine' },
  experience: { type: Number, default: 5 },
  jobTitle: { type: String, default: 'Senior consultant' },
  about: { type: String },
  fees: { type: Number, default: 500 },
  price: { type: Number, default: 500 },
  image: { type: String },
  available: { type: Boolean, default: true },
  availabilityStatus: { type: String, enum: ['Available', 'Busy', 'On Leave'], default: 'Available' },
  address: {
    line1: { type: String },
    line2: { type: String },
  },
  hospital: { type: String },
  qualifications: { type: String },
  degree: { type: String },
  contact_number: { type: String },
  instagram: { type: String },
  facebook: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  reels: [mongoose.Schema.Types.Mixed],
  youtube_videos: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: String, default: '0' },
  isStarDoctor: { type: Boolean, default: false },
  isFirstLogin: { type: Boolean, default: true },
  passwordSet: { type: Boolean, default: false },
  licenseNumber: { type: String, default: '' },
  awards: [{ type: String }],
  certifications: [{ type: String }],
  memberships: [{ type: String }],
  careerExperience: [{ type: String }],
  tags: [{ type: String }],
  faqs: [{
    question: { type: String },
    answer: { type: String },
    q: { type: String },
    a: { type: String },
    steps: [{ type: String }],
    note: { type: String }
  }],
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  tokenVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
  availableDays: { type: String, default: 'Mon - Sat (10am - 4pm)' },
  scheduleDays: [{ type: String }],
  availableSlots: [{ type: String }],
  slotDuration: { type: Number, default: 20 },
  dayWiseSlots: { type: Object, default: {} },
  dateWiseSlots: { type: Object, default: {} },
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
