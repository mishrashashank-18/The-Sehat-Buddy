import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest' },
  docId: { type: String, required: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, required: true },
  amount: { type: Number, default: 500 },
  date: { type: Number, default: Date.now },
  status: { type: String, default: 'Confirmed' },
  symptoms: { type: String, default: 'General Consultation' },
  consultationType: { type: String, default: 'In-Clinic Visit' },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
