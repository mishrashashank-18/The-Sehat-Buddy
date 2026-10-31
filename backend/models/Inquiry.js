import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    category: {
      type: String,
      default: 'General Inquiries & Feedback',
      trim: true
    },
    priority: {
      type: String,
      enum: ['Normal', 'Urgent', 'Medical Emergency', 'Emergency'],
      default: 'Normal'
    },
    message: {
      type: String,
      required: [true, 'Please provide your medical query or message'],
      trim: true,
      maxlength: [4000, 'Message cannot exceed 4000 characters']
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Contacted', 'Resolved', 'Archived'],
      default: 'Pending'
    },
    adminNotes: {
      type: String,
      default: ''
    },
    respondedAt: {
      type: Date
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup by date, status, category, email
inquirySchema.index({ createdAt: -1 });
inquirySchema.index({ status: 1 });
inquirySchema.index({ email: 1 });

const Inquiry = mongoose.models.Inquiry || mongoose.model('Inquiry', inquirySchema);

export default Inquiry;
