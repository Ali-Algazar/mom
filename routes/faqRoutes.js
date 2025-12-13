const express = require('express');
const router = express.Router();
const {
  getFaqs,
  searchFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} = require('../controllers/faqController');

// 🔥 التصحيح 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getFaqs)
  .post(protect, authorize('super_admin'), createFaq);

// مسار البحث (مفتوح عشان الشات بوت)
router.post('/search', searchFaqs);

router.route('/:id')
  .put(protect, authorize('super_admin'), updateFaq)
  .delete(protect, authorize('super_admin'), deleteFaq);

module.exports = router;