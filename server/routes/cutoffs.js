import { Router } from 'express';
import Cutoff from '../models/Cutoff.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { year, courseId, quota } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (courseId) filter.course = courseId;
    if (quota) filter.quota = quota;
    const cutoffs = await Cutoff.find(filter).populate('course', 'name code degree').sort('course closingMark');
    res.json(cutoffs);
  } catch (err) {
    next(err);
  }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const cutoff = await Cutoff.create(req.body);
    await cutoff.populate('course', 'name code degree');
    res.status(201).json(cutoff);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const cutoff = await Cutoff.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
      'course',
      'name code degree'
    );
    if (!cutoff) return res.status(404).json({ message: 'Cutoff not found' });
    res.json(cutoff);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const cutoff = await Cutoff.findByIdAndDelete(req.params.id);
    if (!cutoff) return res.status(404).json({ message: 'Cutoff not found' });
    res.json({ message: 'Cutoff deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
