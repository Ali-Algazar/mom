const express = require('express');
const router = express.Router();
const {
  createHealthUnit,
  getHealthUnits,
  updateHealthUnit,
  deleteHealthUnit,
} = require('../controllers/locationController');

const { protect, authorize } = require('../middleware/authMiddleware');

// المسار العام (بدون ID)
router
  .route('/')
  .get(getHealthUnits) // متاح للكل
  .post(protect, authorize('super_admin'), createHealthUnit); // إضافة: وزارة فقط

// المسار الخاص بالوحدة (بالـ ID)
router
  .route('/:id')
  .put(protect, authorize('super_admin'), updateHealthUnit)   // تعديل: وزارة فقط
  .delete(protect, authorize('super_admin'), deleteHealthUnit); // حذف: وزارة فقط

module.exports = router;