import mongoose from 'mongoose';

const pendingMediaDeletionSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    resourceType: {
      type: String,
      enum: ['video', 'image', 'raw'],
      default: 'video'
    },
    assetType: {
      type: String,
      enum: ['video', 'cover'],
      default: 'video'
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'failed', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    lastError: {
      type: String,
      default: null
    },
    nextRetryAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lockedAt: {
      type: Date,
      default: null,
      index: true
    },
    lockedBy: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

pendingMediaDeletionSchema.index({ status: 1, nextRetryAt: 1 });

const PendingMediaDeletion = mongoose.models.PendingMediaDeletion || mongoose.model('PendingMediaDeletion', pendingMediaDeletionSchema);

export default PendingMediaDeletion;
