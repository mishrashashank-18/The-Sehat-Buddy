import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  messageId: { type: String },
  error: { type: String }
}, { timestamps: true });

emailLogSchema.index({ createdAt: 1, status: 1 });

export default mongoose.model('EmailLog', emailLogSchema);
