import mongoose from 'mongoose';

const specialityProcedureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['speciality', 'procedure'], 
    required: true 
  },
  icon: { type: String, default: 'Bot' },
  description: { type: String, default: '' },
  isPopular: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  insuranceCovered: { type: Boolean, default: true },
  insuranceDetails: {
    coveragePercent: { type: String, default: 'Up to 100% Covered' },
    cashlessAvailable: { type: Boolean, default: true },
    preAuthHours: { type: String, default: '30 Mins Pre-Approval' },
    estimatedCostRange: { type: String, default: '₹40,000 - ₹90,000' },
    outOfPocketWithInsurance: { type: String, default: '₹0 with Cashless Mediclaim' },
    emiAvailable: { type: Boolean, default: true }
  },
  procedures: [{ type: String }] // Sub-procedures or surgeries for this speciality
}, { timestamps: true });

const SpecialityProcedure = mongoose.model('SpecialityProcedure', specialityProcedureSchema);
export default SpecialityProcedure;
