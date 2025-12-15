const express = require('express');
const router = express.Router();
const {
  createSound,
  getAllSounds,
  getSoundById,
  updateSound,
  deleteSound,
} = require('../controllers/soundController');

const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .post(protect, authorize('super_admin'), createSound) // للوزارة فقط
  .get(getAllSounds); // للجميع

router
  .route('/:id')
  .get(getSoundById)
  .put(protect, authorize('super_admin'), updateSound)
  .delete(protect, authorize('super_admin'), deleteSound);

module.exports = router;