// routes/dailyLogRoutes.js

const express = require('express');
const router = express.Router();
const {
  addDailyLog,
  getChildDailyLogs,
  updateDailyLog,
  deleteDailyLog,
} = require('../controllers/dailyLogController');

const { protect } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// إضافة سجل يومي جديد
// POST /api/v1/logs
router.post('/', protect, addDailyLog);

// جلب كل سجلات طفل معين
// GET /api/v1/logs/child/:childId
router.get('/child/:childId', protect, getChildDailyLogs);

// تعديل أو حذف سجل معين
// PUT & DELETE /api/v1/logs/:logId
router
  .route('/:logId')
  .put(protect, updateDailyLog)
  .delete(protect, deleteDailyLog);

module.exports = router;