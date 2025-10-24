// routes/doctorRoutes.js

const express = require('express');
const router = express.Router();
const {
  createDoctor,
  getNearbyDoctors,
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');

const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// (للأدمن: إنشاء) - (للجميع: جلب الكل)
router
  .route('/')
  .post(protect, admin, createDoctor)
  .get(getAllDoctors);

// (هام: يجب أن يكون مسار "nearby" قبل مسار ":id"
//  حتى لا يعتبر "nearby" كـ ID)
// (للجميع: جلب الأقرب)
router.get('/nearby', getNearbyDoctors);

// (للجميع: جلب واحد) - (للأدمن: تعديل وحذف)
router
  .route('/:id')
  .get(getDoctorById)
  .put(protect, admin, updateDoctor)
  .delete(protect, admin, deleteDoctor);

module.exports = router;