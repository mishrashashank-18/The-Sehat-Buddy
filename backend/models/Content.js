import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // 'hero', 'services', 'features', 'articles'
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

const Content = mongoose.model('Content', contentSchema);
export default Content;
