import mongoose from 'mongoose';

const corporateSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  website: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const Corporate = mongoose.model('Corporate', corporateSchema);
export default Corporate;
