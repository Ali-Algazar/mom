const express = require('express');
const router = express.Router();
const {
  createFaq,
  getAllFaqs,
  searchFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
} = require('../controllers/faqController');

const { protect, authorize } = require('../middleware/authMiddleware');

// هام: مسار البحث أولاً
router.get('/search', searchFaqs);

router
  .route('/')
  .post(protect, authorize('super_admin'), createFaq)
  .get(getAllFaqs);

router
  .route('/:id')
  .get(getFaqById)
  .put(protect, authorize('super_admin'), updateFaq)
  .delete(protect, authorize('super_admin'), deleteFaq);

module.exports = router;