const express = require('express');
const router = express.Router();
const {
  getVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
} = require('../controllers/vaccineController');

// 🔥 التصحيح هنا: لازم نستخدم الأقواس {} لأننا بنستورد من ملف بيصدر أكتر من دالة
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(getVaccines) // عرض التطعيمات متاح للكل (ممكن تخليه protect لو عايز)
  .post(protect, authorize('super_admin'), addVaccine); // الإضافة للوزارة بس

router
  .route('/:id')
  .put(protect, authorize('super_admin'), updateVaccine) // التعديل للوزارة بس
  .delete(protect, authorize('super_admin'), deleteVaccine); // الحذف للوزارة بس

module.exports = router;