const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');

// 🔥 التصحيح 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getMedicines) // الكل يشوف
  .post(protect, authorize('super_admin'), createMedicine); // الوزارة تضيف

router.route('/:id')
  .get(getMedicineById)
  .put(protect, authorize('super_admin'), updateMedicine)
  .delete(protect, authorize('super_admin'), deleteMedicine);

module.exports = router;