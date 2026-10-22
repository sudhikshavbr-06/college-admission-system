import mongoose from 'mongoose';

const cutoffSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    year: { type: Number, default: 2026 },
    quota: { type: String, enum: ['government', 'management'], required: true },
    category: { type: String, enum: ['OC', 'BC', 'MBC', 'SC', 'ST'], required: true },
    openingMark: { type: Number, required: true, min: 0, max: 200 },
    closingMark: { type: Number, required: true, min: 0, max: 200 },
  },
  { timestamps: true }
);

cutoffSchema.index({ course: 1, year: 1, quota: 1, category: 1 }, { unique: true });

export default mongoose.model('Cutoff', cutoffSchema);
