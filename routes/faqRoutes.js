// routes/faqRoutes.js

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

const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// (للأدمن: إنشاء) - (للجميع: جلب الكل)
router
  .route('/')
  .post(protect, admin, createFaq)
  .get(getAllFaqs);

// (هام: يجب أن يكون مسار "search" قبل مسار ":id"
//  حتى لا يعتبر "search" كـ ID)
// (للبوت: البحث)
router.get('/search', searchFaqs);

// (للجميع: جلب واحد) - (للأدمن: تعديل وحذف)
router
  .route('/:id')
  .get(getFaqById)
  .put(protect, admin, updateFaq)
  .delete(protect, admin, deleteFaq);

module.exports = router;