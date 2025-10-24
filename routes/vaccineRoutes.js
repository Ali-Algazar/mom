// routes/vaccineRoutes.js

const express = require('express');
const router = express.Router();

// 1. استيراد الوظائف الجديدة
const {
  createVaccine,
  getAllVaccines,
  updateVaccine,
  deleteVaccine,
} = require('../controllers/vaccineController');
const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// المسارات التي لا تحتاج ID ( /api/v1/vaccines )
router
  .route('/')
  .post(protect, admin, createVaccine) // (موجود من قبل - للأدمن)
  .get(getAllVaccines); // (جديد - للجميع، لا يحتاج "protect")

// المسارات التي تحتاج ID ( /api/v1/vaccines/:id )
router
  .route('/:id')
  .put(protect, admin, updateVaccine)    // (جديد - للأدمن)
  .delete(protect, admin, deleteVaccine); // (جديد - للأدمن)

module.exports = router;