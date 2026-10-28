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
  tokenVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
  state: { type: String },
  zip: { type: String },
  phone: { type: String },
  image: { type: String },
  description: { type: String },
  specialities: [{ type: String }],
  isVerified: { type: Boolean, default: false },
  profileCompletion: { type: Number, default: 0 },
  publicationStatus: {
    type: String,
    enum: ['draft', 'pending_review', 'published', 'suspended'],
    default: 'draft',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active',
    index: true
  },
  showOnHome: {
    type: Boolean,
    default: true,
    index: true
  },
  homeUpdatedAt: {
    type: Number,
    default: 0,
    index: true
  },
  rating: { type: Number, default: 0 },
  reviews: { type: String, default: '0 Reviews' },
  totalBeds: { type: Number, default: 0 },
  availableBeds: { type: Number, default: 0 },
  emptyBeds: { type: Number, default: 0 },
  emergency24x7: { type: Boolean, default: false },
  establishedYear: { type: Number },
  instagram: { type: String, default: '' },
  facebook: { type: String, default: '' },
  reels: [mongoose.Schema.Types.Mixed],
  youtube_videos: [mongoose.Schema.Types.Mixed],
  photos: [{
    url: { type: String, required: true },
    title: { type: String, default: '' },
    category: { type: String, default: 'facility' },
    createdAt: { type: Date, default: Date.now }
  }],
  star_doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
  staff_emails: [{ type: String }],
  staff_doctors: [{
    name: { type: String },
    email: { type: String, required: true }
  }],
  cashlessInsurance: { type: Boolean, default: false },
  acceptedInsurances: [{ type: String }],
  tpaHelpdesk: {
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    preAuthTime: { type: String, default: '' }
  },
  insuranceHelpline: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  erCases: { type: [mongoose.Schema.Types.Mixed], default: [] },
  ambulances: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, { timestamps: true, minimize: false, versionKey: false });

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
