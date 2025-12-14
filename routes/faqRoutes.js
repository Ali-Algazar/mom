const express = require('express');
const router = express.Router();
const {
  getFaqs,
  searchFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} = require('../controllers/faqController');

const { protect, authorize } = require('../middleware/authMiddleware');

// البحث متاح للكل
router.post('/search', searchFaqs);
router.get('/', getFaqs); // عرض الأسئلة متاح للكل (أو ممكن تخليه محمي)

// باقي العمليات (إضافة/تعديل/حذف) للوزارة والموظفين فقط
router.use(protect); // تفعيل الحماية لكل اللي جاي

router.post('/', authorize('super_admin', 'staff'), createFaq);

router.route('/:id')
  .put(authorize('super_admin'), updateFaq)
  .delete(authorize('super_admin'), deleteFaq);

module.exports = router;