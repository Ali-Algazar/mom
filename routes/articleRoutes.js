const express = require('express');
const router = express.Router();
const {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');

// 🔥 التصحيح: استخدام الأقواس {} للاستيراد السليم 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

// المسارات
router
  .route('/')
  .get(getArticles) // متاح للكل (أمهات وموظفين)
  .post(protect, authorize('super_admin'), createArticle); // إضافة مقال: وزارة بس

router
  .route('/:id')
  .get(getArticleById)
  .put(protect, authorize('super_admin'), updateArticle) // تعديل: وزارة بس
  .delete(protect, authorize('super_admin'), deleteArticle); // حذف: وزارة بس

module.exports = router;