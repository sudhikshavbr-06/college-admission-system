import { Router } from 'express';
import User from '../models/User.js';
import Application from '../models/Application.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/students', protect, adminOnly, async (req, res, next) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = { role: 'student' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const students = await User.find(filter).sort('-createdAt').limit(500).lean();
    const apps = await Application.find({ student: { $in: students.map((s) => s._id) } })
      .populate('course', 'name code')
      .lean();
    const byStudent = Object.fromEntries(apps.map((a) => [a.student.toString(), a]));
    res.json(
      students.map((s) => {
        const a = byStudent[s._id.toString()];
        return {
          id: s._id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          createdAt: s.createdAt,
          application: a
            ? {
                applicationNumber: a.applicationNumber,
                status: a.status,
                quota: a.quota,
                course: a.course?.name,
              }
            : null,
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

export default router;
