const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  googleLogin,
  facebookLogin,
  createStaff,
  createFirstAdmin,
  updateFcmToken // <-- استيراد الدالة الجديدة
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/authMiddleware');

// مسارات عامة
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/setup-admin', createFirstAdmin);

// مسارات محمية
router.get('/me', protect, getMe);
router.put('/fcm-token', protect, updateFcmToken); // 🔥 الرابط الجديد

// مسارات الأدمن
router.post('/admin/create-staff', protect, authorize('super_admin'), createStaff);

module.exports = router;