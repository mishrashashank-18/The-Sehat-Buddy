import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String },
  state: { type: String },
  zip: { type: String },
  phone: { type: String },
  image: { type: String },
  description: { type: String },
  specialities: [{ type: String }],
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

hospitalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

hospitalSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
