import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: Number, required: true },
  about: { type: String },
  fees: { type: Number, required: true },
  image: { type: String },
  available: { type: Boolean, default: true },
  address: {
    line1: { type: String },
    line2: { type: String },
  },
  date: { type: Number, default: Date.now },
  slots_booked: { type: Object, default: {} },
}, { timestamps: true, minimize: false });

doctorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

doctorSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
