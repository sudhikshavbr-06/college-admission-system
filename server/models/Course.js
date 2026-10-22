import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    credits: { type: Number, default: 3 },
  },
  { _id: false }
);

const semesterSchema = new mongoose.Schema(
  {
    semester: { type: Number, required: true },
    subjects: { type: [subjectSchema], default: [] },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    degree: { type: String, default: 'B.Tech' },
    department: { type: String, required: true },
    durationYears: { type: Number, default: 4 },
    totalSeats: { type: Number, default: 60 },
    govtSeats: { type: Number, default: 36 },
    mgmtSeats: { type: Number, default: 24 },
    annualFee: { type: Number, required: true },
    mgmtAnnualFee: { type: Number, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: '🎓' },
    accreditation: { type: String, default: 'NAAC A++ Accredited' },
    curriculum: { type: [semesterSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.virtual('seatsFilled').get(function () {
  return this._seatsFilled;
});

export default mongoose.model('Course', courseSchema);
