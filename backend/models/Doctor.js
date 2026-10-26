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
  jobTitle: { type: String, default: '' },
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
  phone: { type: String },
  instagram: { type: String },
  facebook: { type: String },
  linkedin: { type: String },
  twitter: { type: String },
  reels: [mongoose.Schema.Types.Mixed],
  youtube_videos: [{ type: String }],
  rating: { type: Number, default: 0 },
  reviews: { type: String, default: '0' },
  isStarDoctor: { type: Boolean, default: false },
  starUpdatedAt: { type: Number, default: 0 },
  isFirstLogin: { type: Boolean, default: true },
  passwordSet: { type: Boolean, default: false },
  licenseNumber: { type: String, default: '' },
  profileCompletion: { type: Number, default: 0 },
  isProfileComplete: { type: Boolean, default: false },
  awards: [mongoose.Schema.Types.Mixed],
  certifications: [mongoose.Schema.Types.Mixed],
  memberships: [mongoose.Schema.Types.Mixed],
  careerExperience: [mongoose.Schema.Types.Mixed],
  tags: [{ type: String }],
  faqs: [{
    question: { type: String },
    answer: { type: String },
    q: { type: String },
    a: { type: String },
    icon: { type: String },
    image: { type: String },
    category: { type: String },
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
}, { timestamps: true, minimize: false, versionKey: false });

doctorSchema.pre('save', async function() {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Mirror paired fields to prevent desync across schemas and legacy clients
  if (this.specialization || this.specialty) {
    const spec = (this.specialization && this.specialization !== 'General Medicine')
      ? this.specialization
      : (this.specialty || this.specialization || 'General Medicine');
    this.specialization = spec;
    this.specialty = spec;
  }

  if (this.qualifications || this.degree) {
    const deg = this.qualifications || this.degree || '';
    this.qualifications = deg;
    this.degree = deg;
  }

  if (this.fees !== undefined || this.price !== undefined) {
    let feeVal = 500;
    if (this.fees !== undefined && this.fees !== null && this.fees !== 500) {
      feeVal = Number(this.fees);
    } else if (this.price !== undefined && this.price !== null && this.price !== 500) {
      feeVal = Number(this.price);
    } else if (this.fees !== undefined && this.fees !== null) {
      feeVal = Number(this.fees);
    } else if (this.price !== undefined && this.price !== null) {
      feeVal = Number(this.price);
    }
    this.fees = feeVal;
    this.price = feeVal;
  }

  if (this.contact_number !== undefined || this.phone !== undefined) {
    const ph = this.contact_number || this.phone || '';
    this.contact_number = ph;
    this.phone = ph;
  }
});

doctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
