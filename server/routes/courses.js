import { Router } from 'express';
import Course from '../models/Course.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active === 'true') filter.active = true;
    const courses = await Course.find(filter).sort('name');
    res.json(courses);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
