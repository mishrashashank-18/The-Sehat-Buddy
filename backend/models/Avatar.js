import mongoose from 'mongoose';

const avatarSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  url: { type: String, required: true },
  localPath: { type: String },
  isDefault: { type: Boolean, default: true }
}, { timestamps: true });

const Avatar = mongoose.model('Avatar', avatarSchema);
export default Avatar;
