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

const { protect, authorize } = require('../middleware/authMiddleware');

// هام: مسار "nearby" لازم يكون قبل ":id"
router.get('/nearby', getNearbyDoctors);

router
  .route('/')
  .get(getAllDoctors) // الكل يشوف
  .post(protect, authorize('super_admin'), createDoctor); // الوزارة بس تضيف

router
  .route('/:id')
  .get(getDoctorById) // الكل يشوف التفاصيل
  .put(protect, authorize('super_admin'), updateDoctor)   // الوزارة بس تعدل
  .delete(protect, authorize('super_admin'), deleteDoctor); // الوزارة بس تحذف

module.exports = router;