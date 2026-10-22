import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['student', 'admin', null], default: null },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
