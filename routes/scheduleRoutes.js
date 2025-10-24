// routes/scheduleRoutes.js

const express = require('express');
const router = express.Router();

// 1. استيراد الوظائف
const {
  getChildSchedule,
  updateScheduleItem,
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// جلب الجدول الخاص بطفل معين (باستخدام ID الطفل)
// GET /api/v1/schedule/:childId
router.get('/:childId', protect, getChildSchedule);

// تحديث سجل تطعيم معين (باستخدام ID السجل نفسه)
// PUT /api/v1/schedule/:scheduleId
router.put('/:scheduleId', protect, updateScheduleItem);


module.exports = router;