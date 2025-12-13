const express = require('express');
const router = express.Router();

// استيراد كل الدوال من الـ Controller
const {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  getMe,
  updateMe,
  deleteMe,
  updateFcmToken,
  createStaff,      // دالة إنشاء الموظف
  createFirstAdmin, // دالة إنشاء أول أدمن (المؤقتة)
} = require('../controllers/authController');

// استيراد الحماية
const { protect, authorize } = require('../middleware/authMiddleware');

// ===========================================
// 1. المسارات العامة (Public) - مش محتاجة توكن
// ===========================================

// تسجيل دخول/حساب جديد للأم
router.post('/register', registerUser);
router.post('/login', loginUser);

// تسجيل دخول السوشيال
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);

// 🔥 مسار مؤقت لإنشاء السوبر أدمن (امسحه لما تخلص) 🔥
router.post('/setup-admin', createFirstAdmin);


// ===========================================
// 2. مسارات محمية (Private) - محتاجة توكن
// ===========================================

// (أي راوت تحت السطر ده هيتطلب توكن)
router.use(protect);

// بياناتي الشخصية (للأم أو الموظف)
router.get('/me', getMe);
router.put('/me', updateMe);
router.delete('/me', deleteMe);

// تحديث توكن الإشعارات
router.put('/fcmtoken', updateFcmToken);


// ===========================================
// 3. مسارات الوزارة (Super Admin Only)
// ===========================================

// إنشاء حساب موظف جديد
router.post(
  '/admin/create-staff',
  authorize('super_admin'), // حماية إضافية: لازم الرول يكون super_admin
  createStaff
);

module.exports = router;