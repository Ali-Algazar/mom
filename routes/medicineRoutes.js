const express = require('express');
const router = express.Router();
const {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');

const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .post(protect, authorize('super_admin'), createMedicine) // الوزارة فقط
  .get(getAllMedicines); // متاح للكل (حتى الزوار)

router
  .route('/:id')
  .get(getMedicineById)
  .put(protect, authorize('super_admin'), updateMedicine)
  .delete(protect, authorize('super_admin'), deleteMedicine);

module.exports = router;