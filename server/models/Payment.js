import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    type: {
      type: String,
      enum: ['application_fee', 'admission_fee'],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['upi', 'card', 'netbanking'], required: true },
    status: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
    transactionId: { type: String, required: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.receiptNo) {
    const count = await mongoose.model('Payment').countDocuments();
    this.receiptNo = `RCPT26-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

paymentSchema.index({ student: 1, type: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);
