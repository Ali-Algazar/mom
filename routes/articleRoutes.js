const express = require('express');
const router = express.Router();

// استدعاء الكنترولر القديم زي ما هو
const {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');

// استدعاء حماية النظام الجديد
const { protect, authorize } = require('../middleware/authMiddleware');

// تفعيل الحماية على كل الروابط (لازم يكون مسجل دخول عشان يقرأ)
router.use(protect);

router.route('/')
  .get(getAllArticles) // الكل يقدر يقرأ (أمهات وموظفين ووزارة)
  .post(authorize('super_admin'), createArticle); // الوزارة فقط تضيف مقالات

router.route('/:id')
  .get(getArticleById) // الكل يقدر يقرأ مقال محدد
  .put(authorize('super_admin'), updateArticle)    // الوزارة فقط تعدل
  .delete(authorize('super_admin'), deleteArticle); // الوزارة فقط تحذف

module.exports = router;