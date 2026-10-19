import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})*(\.[a-zA-Z]{2,})+$/,
      'Please enter a valid email address'
    ]
  },
  source: {
    type: String,
    default: 'newsletter',
    enum: ['newsletter', 'coming-soon', 'general']
  },
  featureInterest: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['subscribed', 'unsubscribed'],
    default: 'subscribed'
  },
  welcomeEmailSent: {
    type: Boolean,
    default: false
  },
  welcomeEmailSentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

const Subscriber = mongoose.models.Subscriber || mongoose.model('Subscriber', subscriberSchema);

export default Subscriber;
