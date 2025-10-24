// routes/medicineRoutes.js

const express = require('express');
const router = express.Router();
const {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} = require('../controllers/medicineController');

const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// المسارات التي لا تحتاج ID ( /api/v1/medicines )
router
  .route('/')
  .post(protect, admin, createMedicine) // للأدمن فقط
  .get(getAllMedicines); // للجميع

// المسارات التي تحتاج ID ( /api/v1/medicines/:id )
router
  .route('/:id')
  .get(getMedicineById) // للجميع
  .put(protect, admin, updateMedicine) // للأدمن فقط
  .delete(protect, admin, deleteMedicine); // للأدمن فقط

module.exports = router;