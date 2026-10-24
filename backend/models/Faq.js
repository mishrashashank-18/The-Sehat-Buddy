import mongoose from 'mongoose';

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { 
    type: String, 
    default: 'General'
  },
  targetType: { 
    type: String, 
    enum: ['doctor', 'hospital', 'general'], 
    default: 'general' 
  },
  targetId: { type: String, default: '' },
  targetName: { type: String, default: '' },
  icon: { 
    type: String, 
    default: 'calendar' 
  },
  image: { 
    type: String, 
    default: '' 
  },
  note: { type: String, default: '' },
  steps: [{ type: String }],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Faq = mongoose.model('Faq', faqSchema);
export default Faq;
