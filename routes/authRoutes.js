// routes/authRoutes.js

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  createStaff, // <-- الدالة الجديدة
} = require('../controllers/authController');

const { protect, authorize } = require('../middleware/authMiddleware');

// مسارات عامة (أي حد يقدر يدخلها)
router.post('/register', registerUser); // تسجيل الأم
router.post('/login', loginUser);

// مسارات خاصة (تحتاج توكن)
router.get('/me', protect, getMe);

// 🔥 مسار خاص جداً (للوزارة فقط Super Admin) 🔥
// إنشاء حساب موظف جديد
router.post(
  '/admin/create-staff', 
  protect, 
  authorize('super_admin'), // حماية مزدوجة: لازم توكن + لازم يكون super_admin
  createStaff
);

// ... (الكود القديم) ...

// 🔥 مسار مؤقت لإنشاء السوبر أدمن 🔥
router.post('/setup-admin', createFirstAdmin);

module.exports = router;