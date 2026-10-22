import { Router } from 'express';
import Scholarship from '../models/Scholarship.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.active === 'true') filter.active = true;
    const scholarships = await Scholarship.find(filter).sort('name');
    res.json(scholarships);
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const scholarship = await Scholarship.create(req.body);
    res.status(201).json(scholarship);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
    res.json(scholarship);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const scholarship = await Scholarship.findByIdAndDelete(req.params.id);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship not found' });
    res.json({ message: 'Scholarship deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
