import mongoose from 'mongoose';

export const APPLICATION_STATUSES = [
  'submitted',
  'under_review',
  'documents_pending',
  'verified',
  'accepted',
  'rejected',
];

export const DOC_TYPES = [
  { key: 'photo', label: 'Passport-size Photograph', required: true },
  { key: 'id_proof', label: 'Aadhaar / ID Proof', required: true },
  { key: 'tenth_marksheet', label: '10th Marksheet', required: true },
  { key: 'twelfth_marksheet', label: '12th Marksheet', required: true },
  { key: 'transfer_certificate', label: 'Transfer Certificate', required: true },
  { key: 'community_certificate', label: 'Community Certificate', required: false },
  { key: 'income_certificate', label: 'Income Certificate', required: false },
  { key: 'migration_certificate', label: 'Migration Certificate', required: false },
];

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    remarks: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    applicationNumber: { type: String, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'submitted',
    },
    personal: {
      fullName: { type: String, required: true },
      dob: { type: Date, required: true },
      gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      parentName: { type: String, required: true },
      parentPhone: { type: String, required: true },
      address: {
        street: { type: String, default: '' },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
      },
    },
    academic: {
      tenth: {
        school: { type: String, required: true },
        board: { type: String, required: true },
        year: { type: Number, required: true },
        percentage: { type: Number, required: true, min: 0, max: 100 },
      },
      twelfth: {
        school: { type: String, required: true },
        board: { type: String, required: true },
        year: { type: Number, required: true },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        cutOffMark: { type: Number, required: true, min: 0, max: 200 },
      },
    },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    quota: { type: String, enum: ['government', 'management', 'scholarship'], default: 'government' },
    category: { type: String, enum: ['OC', 'BC', 'MBC', 'SC', 'ST'], default: 'OC' },
    scholarship: { type: mongoose.Schema.Types.ObjectId, ref: 'Scholarship', default: null },
    documents: { type: [documentSchema], default: [] },
    timeline: { type: [timelineSchema], default: [] },
    adminRemark: { type: String, default: '' },
  },
  { timestamps: true }
);

applicationSchema.pre('validate', async function (next) {
  if (this.isNew && !this.applicationNumber) {
    const count = await mongoose.model('Application').countDocuments();
    this.applicationNumber = `MIT26-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.isNew && this.timeline.length === 0) {
    this.timeline.push({ status: 'submitted', note: 'Application submitted', at: new Date() });
  }
  next();
});

export default mongoose.model('Application', applicationSchema);
