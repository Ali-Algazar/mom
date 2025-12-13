const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getNearbyDoctors // لو عندك دالة البحث عن القريبين
} = require('../controllers/doctorController');

// 🔥 التصحيح 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

// البحث عن الأطباء (متاح للكل)
router.get('/', getDoctors);
router.get('/nearby', getNearbyDoctors); // لو موجودة
router.get('/:id', getDoctorById);

// الإدارة (للوزارة Super Admin فقط)
router.post('/', protect, authorize('super_admin'), createDoctor);
router.put('/:id', protect, authorize('super_admin'), updateDoctor);
router.delete('/:id', protect, authorize('super_admin'), deleteDoctor);

module.exports = router;