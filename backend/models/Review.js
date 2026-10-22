import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  patientCity: { type: String, default: 'Bengaluru' },
  targetType: { 
    type: String, 
    enum: ['hospital', 'doctor', 'surgery', 'platform'], 
    default: 'hospital' 
  },
  targetId: { type: String, default: '' },
  targetName: { type: String, required: true }, // e.g. Hospital Name, Doctor Name, or Surgery Name
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, default: '' },
  comment: { type: String, required: true },
  isVerified: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['approved', 'pending', 'rejected'], 
    default: 'approved' 
  },
  treatment: { type: String, default: '' }, // e.g. "Total Knee Replacement", "Cardiac Consultation"
  insuranceUsed: { type: String, default: 'None' }, // e.g. "Star Health", "HDFC ERGO", "Cashless Claim"
  doctorId: { type: String, default: '' },
  doctorName: { type: String, default: '' },
  userId: { type: String, default: '' },
  userEmail: { type: String, default: '' }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
