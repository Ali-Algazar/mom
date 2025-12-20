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
} = require('../controllers/userController');

const { protect, admin } = require('../middleware/authMiddleware'); // تأكد من مسار الميدلوير

// 1. التوثيق العام (Public)
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/facebook', facebookLogin);
router.post('/setup-admin', createFirstAdmin); // تشغيل مرة واحدة فقط

// 2. إدارة الحساب الشخصي (Private - Logged In User)
// (كل الراوتس اللي تحت دي محتاجة تسجيل دخول)
router.use(protect);

router.get('/me', getMe);
router.put('/fcm-token', updateFcmToken);
router.put('/profile', updateUserProfile);   // تعديل البيانات
router.delete('/profile', deleteMyAccount);  // حذف حسابي

// 3. إدارة الأدمن (Admin Only)
// (إنشاء موظفين + حذف أي حد)
router.post('/admin/create-staff', admin, createStaff);
router.delete('/users/:id', admin, deleteUserByAdmin); // الوزارة تحذف أي يوزر

module.exports = router;