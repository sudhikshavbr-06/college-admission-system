import { Router } from 'express';
import Application from '../models/Application.js';
import Scholarship from '../models/Scholarship.js';
import { protect, adminOnly } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { emitToUser, emitToAdmins } from '../sockets/emit.js';
import Notification from '../models/Notification.js';

const router = Router();

const notify = async (req, userId, payload) => {
  await Notification.create({ user: userId, ...payload });
  emitToUser(req, userId, 'notification', payload);
};

router.post('/', protect, async (req, res, next) => {
  try {
    const existing = await Application.findOne({ student: req.user._id });
    if (existing) {
      return res.status(409).json({ message: 'You already have an application on file', applicationNumber: existing.applicationNumber });
    }
    const { courseId, quota, category, scholarshipId, personal, academic } = req.body;
    if (!courseId || !personal || !academic?.tenth || !academic?.twelfth) {
      return res.status(400).json({ message: 'Missing required application data' });
    }
    let scholarship = null;
    if (quota === 'scholarship') {
      if (!scholarshipId) return res.status(400).json({ message: 'Select a scholarship for the scholarship quota' });
      scholarship = await Scholarship.findById(scholarshipId);
      if (!scholarship || !scholarship.active) {
        return res.status(400).json({ message: 'Selected scholarship is not available' });
      }
      if (academic.twelfth.percentage < scholarship.minPercentage) {
        return res.status(400).json({
          message: `This scholarship requires at least ${scholarship.minPercentage}% in 12th standard`,
        });
      }
      if (scholarship.categories.length > 0 && !scholarship.categories.includes(category)) {
        return res.status(400).json({ message: 'This scholarship is not available for your category' });
      }
    }
    const application = await Application.create({
      student: req.user._id,
      course: courseId,
      quota: quota || 'government',
      category: category || 'OC',
      scholarship: scholarship?._id || null,
      personal,
      academic,
      timeline: [{ status: 'submitted', note: 'Application submitted successfully', at: new Date() }],
    });
    await application.populate('course', 'name code degree');

    const payload = {
      title: 'Application Submitted',
      message: `Your application ${application.applicationNumber} has been received.`,
      type: 'success',
      link: '/dashboard',
    };
    await notify(req, req.user._id, payload);
    emitToAdmins(req, 'application:submitted', {
      applicationNumber: application.applicationNumber,
      studentName: application.personal.fullName,
      course: application.course?.name,
      quota: application.quota,
    });
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

router.get('/mine', protect, async (req, res, next) => {
  try {
    const application = await Application.findOne({ student: req.user._id })
      .populate('course', 'name code degree department durationYears annualFee mgmtAnnualFee')
      .populate('scholarship', 'name discountPercent minPercentage');
    res.json(application);
  } catch (err) {
    next(err);
  }
});

router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, quota, courseId, search, hasPendingDocs } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (quota) filter.quota = quota;
    if (courseId) filter.course = courseId;
    if (hasPendingDocs === '1') filter['documents.status'] = 'pending';
    let query = Application.find(filter)
      .populate('course', 'name code degree')
      .populate('scholarship', 'name discountPercent')
      .populate('student', 'name email')
      .sort('-createdAt');
    if (search) {
      const rx = { $regex: search, $options: 'i' };
      query = query.where({
        $or: [
          { applicationNumber: rx },
          { 'personal.fullName': rx },
          { 'personal.email': rx },
          { 'personal.phone': rx },
        ],
      });
    }
    const applications = await query.limit(300);
    res.json(applications);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', protect, async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('course', 'name code degree department')
      .populate('scholarship', 'name discountPercent minPercentage')
      .populate('student', 'name email');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    const isOwner = application.student._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(application);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/documents', protect, upload.single('file'), async (req, res, next) => {
  try {
    const application = await Application.findOne({ student: req.user._id });
    if (!application) return res.status(404).json({ message: 'No application found. Submit one first.' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const type = req.body.type;
    if (!type) return res.status(400).json({ message: 'Document type is required' });

    application.documents = application.documents.filter((d) => d.type !== type);
    application.documents.push({
      type,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
      mimeType: req.file.mimetype,
      status: 'pending',
      remarks: '',
      uploadedAt: new Date(),
    });
    application.timeline.push({
      status: application.status,
      note: `Document uploaded: ${type.replaceAll('_', ' ')}`,
      at: new Date(),
    });
    await application.save();

    emitToAdmins(req, 'document:uploaded', {
      applicationNumber: application.applicationNumber,
      studentName: application.personal.fullName,
      docType: type,
    });
    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/documents/:docId', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid document status' });
    }
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    const doc = application.documents.id(req.params.docId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    doc.status = status;
    doc.remarks = remarks || '';
    if (status === 'verified' && application.documents.every((d) => d.status === 'verified')) {
      application.status = 'verified';
      application.timeline.push({ status: 'verified', note: 'All documents verified', at: new Date() });
    }
    await application.save();

    const label = doc.type.replaceAll('_', ' ');
    const payload = {
      title: status === 'verified' ? 'Document Verified' : 'Document Rejected',
      message:
        status === 'verified'
          ? `Your ${label} has been verified.`
          : `Your ${label} was rejected. ${remarks || 'Please re-upload a valid copy.'}`,
      type: status === 'verified' ? 'success' : 'warning',
      link: '/dashboard/documents',
    };
    await Notification.create({ user: application.student, ...payload });
    emitToUser(req, application.student, 'notification', payload);
    emitToUser(req, application.student, 'document:reviewed', {
      applicationNumber: application.applicationNumber,
      docType: doc.type,
      status,
    });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!['submitted', 'under_review', 'documents_pending', 'verified', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const application = await Application.findById(req.params.id).populate('course', 'name');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    application.status = status;
    if (note) application.adminRemark = note;
    application.timeline.push({ status, note: note || `Status updated to ${status.replaceAll('_', ' ')}`, at: new Date() });
    await application.save();

    const messages = {
      under_review: 'Your application is now under review by the admissions office.',
      documents_pending: 'Action required: some documents are missing or need to be re-uploaded.',
      verified: 'Your application and documents have been verified.',
      accepted: `Congratulations! You have been accepted to ${application.course?.name}. Please complete your admission fee payment.`,
      rejected: note || 'Your application has been rejected. Contact the admissions office for details.',
    };
    const payload = {
      title: `Application ${status.replaceAll('_', ' ')}`,
      message: messages[status] || 'Your application status was updated.',
      type:
        status === 'accepted'
          ? 'success'
          : status === 'rejected'
            ? 'error'
            : status === 'documents_pending'
              ? 'warning'
              : 'info',
      link: '/dashboard',
    };
    await Notification.create({ user: application.student, ...payload });
    emitToUser(req, application.student, 'notification', payload);
    emitToUser(req, application.student, 'application:updated', {
      applicationNumber: application.applicationNumber,
      status,
      message: payload.message,
    });
    res.json(application);
  } catch (err) {
    next(err);
  }
});

export default router;
