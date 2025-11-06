// routes/authRoutes.js

const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin, // <-- استيراد
  facebookLogin, // <-- استيراد
  getMe,
  updateMe,
  deleteMe,
  updateFcmToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// --- المسارات العامة (Public) ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin); // <-- إضافة مسار جوجل
router.post('/facebook', facebookLogin); // <-- إضافة مسار فيسبوك

// --- المسارات الخاصة بالمستخدم (Private /me) ---
router
  .route('/me')
  .get(protect, getMe)
  .put(protect, updateMe)
  .delete(protect, deleteMe);

// (لتحديث "عنوان" هاتف المستخدم)
router.put('/fcmtoken', protect, updateFcmToken);

module.exports = router;