import { Router } from 'express';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Scholarship from '../models/Scholarship.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/public', async (req, res, next) => {
  try {
    const [courses, applications, scholarships] = await Promise.all([
      Course.countDocuments({ active: true }),
      Application.countDocuments(),
      Scholarship.countDocuments({ active: true }),
    ]);
    res.json({ courses, applications, scholarships, placementRate: 96, recruitingPartners: 240 });
  } catch (err) {
    next(err);
  }
});

router.get('/overview', protect, adminOnly, async (req, res, next) => {
  try {
    const [totalStudents, totalApplications, totalCourses, totalScholarships, statusAgg, quotaAgg, courseAgg, revenueAgg, revenueByMonth, pendingDocs, recent] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        Application.countDocuments(),
        Course.countDocuments(),
        Scholarship.countDocuments({ active: true }),
        Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        Application.aggregate([{ $group: { _id: '$quota', count: { $sum: 1 } } }]),
        Application.aggregate([
          { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
          { $unwind: '$course' },
          { $group: { _id: '$course.code', name: { $first: '$course.name' }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 8 },
        ]),
        Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }]),
        Payment.aggregate([
          { $match: { status: 'success' } },
          {
            $group: {
              _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]),
        Application.aggregate([{ $unwind: '$documents' }, { $match: { 'documents.status': 'pending' } }, { $count: 'count' }]),
        Application.find()
          .sort('-createdAt')
          .limit(8)
          .populate('course', 'name code')
          .populate('student', 'name'),
      ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    res.json({
      totals: {
        students: totalStudents,
        applications: totalApplications,
        courses: totalCourses,
        scholarships: totalScholarships,
        revenue: revenueAgg[0]?.total || 0,
        transactions: revenueAgg[0]?.count || 0,
        pendingDocuments: pendingDocs[0]?.count || 0,
      },
      byStatus: Object.fromEntries(statusAgg.map((s) => [s._id, s.count])),
      byQuota: Object.fromEntries(quotaAgg.map((s) => [s._id || 'government', s.count])),
      byCourse: courseAgg.map((c) => ({ code: c._id, name: c.name, count: c.count })),
      revenueByMonth: revenueByMonth.map((r) => ({
        month: `${monthNames[r._id.month - 1]} ${String(r._id.year).slice(2)}`,
        total: r.total,
        count: r.count,
      })),
      recentApplications: recent.map((a) => ({
        id: a._id,
        applicationNumber: a.applicationNumber,
        studentName: a.personal?.fullName || a.student?.name,
        course: a.course?.name,
        quota: a.quota,
        status: a.status,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
