import mongoose from 'mongoose';

const scholarshipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['merit', 'need_based', 'sports', 'special'], default: 'merit' },
    minPercentage: { type: Number, default: 0, min: 0, max: 100 },
    categories: { type: [String], default: [] },
    discountPercent: { type: Number, required: true, min: 0, max: 100 },
    seats: { type: Number, default: 50 },
    deadline: { type: Date, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Scholarship', scholarshipSchema);
