import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.get('/mine', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      $or: [{ user: req.user._id }, { user: null, role: req.user.role }],
    })
      .sort('-createdAt')
      .limit(30);
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ user: req.user._id }, { user: null, role: req.user.role }], read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notification);
  } catch (err) {
    next(err);
  }
});

export default router;
