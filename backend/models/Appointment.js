import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: { type: String, default: 'guest' },
  docId: { type: String, required: false, index: true },
  hospitalId: { type: String, required: false, index: true },
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  userData: { type: Object, required: true },
  docData: { type: Object, default: null },
  hospitalData: { type: Object, default: null },
  department: { type: String, default: 'General Medicine' },
  appointmentType: { type: String, default: 'doctor' }, // 'doctor' | 'hospital'
  amount: { type: Number, default: 0 },
  date: { type: Number, default: Date.now },
  status: { type: String, default: 'Confirmed' },
  symptoms: { type: String, default: 'General Consultation' },
  consultationType: { type: String, default: 'In-Clinic Visit' },
  cancelled: { type: Boolean, default: false },
  payment: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
}, { timestamps: true });

appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ docId: 1, createdAt: -1 });
appointmentSchema.index({ 'docData.id': 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
