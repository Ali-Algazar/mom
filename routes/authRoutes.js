// routes/authRoutes.js

const express = require('express');
const router = express.Router();

// 1. استيراد الوظائف الجديدة
const {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  deleteMe,
  updateFcmToken, // <-- إضافة جديدة
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// --- المسارات العامة (Public) ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- المسارات الخاصة بالمستخدم (Private /me) ---
router
  .route('/me')
  .get(protect, getMe)
  .put(protect, updateMe)
  .delete(protect, deleteMe);

// --- (2. المسار الجديد للإشعارات) ---
// (لتحديث "عنوان" هاتف المستخدم)
router.put('/fcmtoken', protect, updateFcmToken);

module.exports = router;