const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  createStaff,
  createFirstAdmin,
  getMe,
  updateFcmToken,
  updateUserProfile,
  deleteMyAccount,
  deleteUserByAdmin,
} = require('../controllers/authController');

// ✅ التعديل هنا: استدعاء authorize بدلاً من admin
const { protect, authorize } = require('../middleware/authMiddleware');

// =================================================================
// 1. التوثيق العام (Public) - متاح للجميع
// =================================================================
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/setup-admin', createFirstAdmin); // يُستخدم مرة واحدة

// =================================================================
// 2. إدارة الحساب الشخصي (Private) - يتطلب تسجيل دخول
// =================================================================
// تطبيق حماية التوكن على كل الروابط القادمة
router.use(protect);

router.get('/me', getMe);
router.put('/fcm-token', updateFcmToken);
router.put('/profile', updateUserProfile);   // تعديل بياناتي
router.delete('/profile', deleteMyAccount);  // حذف حسابي

// =================================================================
// 3. إدارة الأدمن (Admin Only) - للوزارة فقط
// =================================================================
// ✅ التعديل هنا: استخدام authorize('super_admin')

router.post(
  '/admin/create-staff', 
  authorize('super_admin'), // مسموح للأدمن فقط
  createStaff
);

router.delete(
  '/users/:id', 
  authorize('super_admin'), // مسموح للأدمن فقط
  deleteUserByAdmin
);

module.exports = router;