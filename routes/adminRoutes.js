const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getDefaulters,
  getVaccineNeedsForecast,
  getAllUsers
} = require('../controllers/adminController');

// 🔥 التصحيح 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // كل اللي جاي محتاج تسجيل دخول

// إحصائيات عامة (للوزارة والموظفين)
router.get('/stats', authorize('super_admin', 'staff'), getDashboardStats);

// تقرير المتخلفين (مهم جداً للموظف عشان يكلمهم)
router.get('/defaulters', authorize('super_admin', 'staff'), getDefaulters);

// تقرير توقعات المخزون (للوزارة والموظف)
router.get('/forecast', authorize('super_admin', 'staff'), getVaccineNeedsForecast);

// إدارة المستخدمين (للوزارة فقط)
router.get('/users', authorize('super_admin'), getAllUsers);

module.exports = router;