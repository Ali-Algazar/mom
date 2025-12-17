const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createChild,
  getChildren,
  getMyChildren, // استيراد الدالة الجديدة
  getChildById,
  updateChild,
  deleteChild
} = require('../controllers/childController');

// الترتيب مهم جداً هنا!

// 1. الراوتس العامة للكنترولر (إضافة وجلب الكل)
router.route('/')
  .post(protect, authorize('staff', 'super_admin'), createChild)
  .get(protect, authorize('staff', 'super_admin'), getChildren);

// 2. راوت الأم (لازم يجي قبل الـ :id)
router.get('/my-children', protect, authorize('user'), getMyChildren);

// 3. راوتس العمليات بالـ ID (في الآخر)
router.route('/:id')
  .get(protect, getChildById)
  .put(protect, authorize('staff', 'super_admin'), updateChild)
  .delete(protect, authorize('super_admin'), deleteChild);

module.exports = router;