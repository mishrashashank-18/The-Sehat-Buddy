import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, select: false },
  role: { type: String, default: 'user' },
  googleId: { type: String, required: false, unique: true, sparse: true },
  image: { type: String, default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg" },
  address: {
    line1: { type: String, default: '' },
    line2: { type: String, default: '' }
  },
  gender: { type: String, default: 'Not Selected' },
  dob: { type: String, default: 'Not Selected' },
  phone: { type: String, default: '0000000000' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  tokenVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.otp;
      delete ret.otpExpires;
      delete ret.otpAttempts;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.otp;
      delete ret.otpExpires;
      delete ret.otpAttempts;
      return ret;
    }
  }
});

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password || typeof this.password !== 'string' || !this.password.trim()) {
    return;
  }
  // Prevent double hashing if password is already a valid bcrypt hash
  const isAlreadyBcryptHash = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(this.password);
  if (!isAlreadyBcryptHash) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
