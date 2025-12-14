const express = require('express');
const router = express.Router();
const {
  createHealthUnit,
  getHealthUnits,
} = require('../controllers/locationController');

const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getHealthUnits) // متاح للكل (عشان الـ Dropdown في الفرونت إند)
  .post(protect, authorize('super_admin'), createHealthUnit); // الإضافة للوزارة بس

module.exports = router;