import mongoose from 'mongoose';

const mediaLockSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // The lock key, e.g. "reel:sehatbuddy/reels/ig_..."
    owner: { type: String, required: true }, // Unique instance/caller ID
    fencingToken: { type: Number, default: 1 }, // Monotonic fencing token
    expiresAt: { type: Date, required: true } // Auto-expiry TTL
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// MongoDB TTL index: documents automatically expire and get removed after expiresAt
mediaLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MediaLock = mongoose.models.MediaLock || mongoose.model('MediaLock', mediaLockSchema);

export default MediaLock;
