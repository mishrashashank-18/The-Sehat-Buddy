import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
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
  otp: { type: String },
  otpExpires: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
