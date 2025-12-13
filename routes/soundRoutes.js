const express = require('express');
const router = express.Router();
const {
  getSounds,
  addSound,
  deleteSound,
} = require('../controllers/soundController');

// 🔥 التصحيح 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getSounds)
  .post(protect, authorize('super_admin'), addSound);

router.route('/:id')
  .delete(protect, authorize('super_admin'), deleteSound);

module.exports = router;