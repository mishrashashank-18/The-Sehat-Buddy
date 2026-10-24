import mongoose from 'mongoose';

const faqSymbolSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  category: { 
    type: String, 
    default: 'General' 
  },
  imageUrl: { 
    type: String, 
    required: true 
  },
  svg: { 
    type: String, 
    default: '' 
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

const FaqSymbol = mongoose.model('FaqSymbol', faqSymbolSchema);
export default FaqSymbol;
