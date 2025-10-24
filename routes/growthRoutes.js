// routes/growthRoutes.js

const express = require('express');
const router = express.Router();
const {
  addGrowthRecord,
  getChildGrowthRecords,
  updateGrowthRecord,
  deleteGrowthRecord,
} = require('../controllers/growthController');

const { protect } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// إضافة سجل نمو جديد
// POST /api/v1/growth
router.post('/', protect, addGrowthRecord);

// جلب كل سجلات طفل معين
// GET /api/v1/growth/child/:childId
router.get('/child/:childId', protect, getChildGrowthRecords);

// تعديل أو حذف سجل معين
// PUT & DELETE /api/v1/growth/:recordId
router
  .route('/:recordId')
  .put(protect, updateGrowthRecord)
  .delete(protect, deleteGrowthRecord);

module.exports = router;