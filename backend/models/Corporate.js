import mongoose from 'mongoose';

const corporateSchema = new mongoose.Schema({
  id: { type: Number },
  name: { type: String, required: true },
  shortName: { type: String, default: '' },
  logoText: { type: String, default: '' },
  category: { type: String, default: 'Enterprise Partner' },
  benefit: { type: String, default: '' },
  employeesCovered: { type: String, default: '50,000+' },
  color: { type: String, default: '#2563EB' },
  bgColor: { type: String, default: '#EFF6FF' },
  logo: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { timestamps: true });

const Corporate = mongoose.model('Corporate', corporateSchema);
export default Corporate;
