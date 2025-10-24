// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllChildren,
  getNotificationLogs,
  // (قمنا بحذف sendCustomNotification)
} = require('../controllers/adminController');

const { protect, admin } = require('../middleware/authMiddleware');

// --- (مسارات إدارة المستخدمين والأطفال) ---
router.get('/users', protect, admin, getAllUsers);
router.get('/children', protect, admin, getAllChildren);

// --- (مسارات إدارة الإشعارات) ---
// (جلب سجلات الإرسال)
router.get('/notifications/logs', protect, admin, getNotificationLogs);

// (قمنا بحذف مسار POST /notifications/broadcast)


module.exports = router;