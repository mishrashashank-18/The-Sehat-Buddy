import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, default: 'admin' },
  tokenVersion: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
  otp: { type: String, select: false },
  otpExpires: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

adminSchema.pre('save', async function() {
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

adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
