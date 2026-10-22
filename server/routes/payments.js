import { Router } from 'express';
import Payment from '../models/Payment.js';
import Application from '../models/Application.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { emitToUser, emitToAdmins } from '../sockets/emit.js';
import Notification from '../models/Notification.js';

const router = Router();

const APPLICATION_FEE = 1000;

const admissionFeeFor = (application) => {
  const base = application.quota === 'management' ? application.course.mgmtAnnualFee : application.course.annualFee;
  const discount = application.quota === 'scholarship' && application.scholarship ? application.scholarship.discountPercent : 0;
  return Math.round(base * (1 - discount / 100));
};

router.get('/due', protect, async (req, res, next) => {
  try {
    const application = await Application.findOne({ student: req.user._id })
      .populate('course', 'name annualFee mgmtAnnualFee')
      .populate('scholarship', 'discountPercent');
    if (!application) return res.json({ items: [] });
    const paid = await Payment.find({ student: req.user._id, status: 'success' }).lean();
    const paidTypes = new Set(paid.map((p) => p.type));
    const items = [];
    if (!paidTypes.has('application_fee')) {
      items.push({ type: 'application_fee', label: 'Application Processing Fee', amount: APPLICATION_FEE, paid: false });
    }
    if (['verified', 'accepted'].includes(application.status) && !paidTypes.has('admission_fee')) {
      items.push({
        type: 'admission_fee',
        label: `Admission Fee — ${application.course?.name} (${application.quota} quota${application.quota === 'scholarship' ? `, ${application.scholarship?.discountPercent}% waived` : ''})`,
        amount: admissionFeeFor(application),
        paid: false,
      });
    }
    res.json({ items, applicationId: application._id, applicationNumber: application.applicationNumber, status: application.status });
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, async (req, res, next) => {
  try {
    const { applicationId, type, method } = req.body;
    if (!['application_fee', 'admission_fee'].includes(type)) {
      return res.status(400).json({ message: 'Invalid payment type' });
    }
    if (!['upi', 'card', 'netbanking'].includes(method)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }
    const application = await Application.findOne({ _id: applicationId, student: req.user._id })
      .populate('course', 'name annualFee mgmtAnnualFee')
      .populate('scholarship', 'discountPercent');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const alreadyPaid = await Payment.findOne({ student: req.user._id, type, status: 'success' });
    if (alreadyPaid) return res.status(409).json({ message: 'This fee has already been paid' });

    let amount;
    if (type === 'application_fee') {
      amount = APPLICATION_FEE;
    } else {
      if (!['verified', 'accepted'].includes(application.status)) {
        return res.status(400).json({ message: 'Admission fee becomes payable once your application is verified/accepted' });
      }
      amount = admissionFeeFor(application);
    }

    const payment = await Payment.create({
      student: req.user._id,
      application: application._id,
      type,
      amount,
      method,
      status: 'success',
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`,
      paidAt: new Date(),
    });

    const labels = { application_fee: 'Application Fee', admission_fee: 'Admission Fee' };
    const payload = {
      title: 'Payment Successful',
      message: `${labels[type]} of ₹${amount.toLocaleString('en-IN')} received. Receipt ${payment.receiptNo}.`,
      type: 'success',
      link: '/dashboard/payments',
    };
    await Notification.create({ user: req.user._id, ...payload });
    emitToUser(req, req.user._id, 'notification', payload);
    emitToUser(req, req.user._id, 'payment:success', { receiptNo: payment.receiptNo, type, amount });
    emitToAdmins(req, 'payment:received', {
      receiptNo: payment.receiptNo,
      studentName: application.personal.fullName,
      type,
      amount,
      method,
    });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const payments = await Payment.find({ student: req.user._id }).sort('-paidAt').populate('application', 'applicationNumber');
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { type, status, method } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (method) filter.method = method;
    const payments = await Payment.find(filter)
      .sort('-paidAt')
      .populate('student', 'name email')
      .populate('application', 'applicationNumber')
      .limit(500);
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

export default router;
