// routes/articleRoutes.js

const express = require('express');
const router = express.Router();
const {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
} = require('../controllers/articleController');

const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// المسارات التي لا تحتاج ID ( /api/v1/articles )
router
  .route('/')
  .post(protect, admin, createArticle) // للأدمن فقط
  .get(getAllArticles); // للجميع

// المسارات التي تحتاج ID ( /api/v1/articles/:id )
router
  .route('/:id')
  .get(getArticleById) // للجميع
  .put(protect, admin, updateArticle) // للأدمن فقط
  .delete(protect, admin, deleteArticle); // للأدمن فقط

module.exports = router;