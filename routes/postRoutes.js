// routes/postRoutes.js

const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likePost, // <-- استيراد الوظيفة الجديدة
} = require('../controllers/postController');
const { addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// المسارات لـ /api/v1/posts
router
  .route('/')
  .post(protect, createPost)
  .get(protect, getAllPosts);

// المسارات لـ /api/v1/posts/:postId
router
  .route('/:postId')
  .get(protect, getPostById)
  .delete(protect, deletePost);

// مسار لإضافة كومنت
router.post('/:postId/comments', protect, addComment);

// --- (المسار الجديد للإعجاب) ---
// PUT /api/v1/posts/:postId/like
router.put('/:postId/like', protect, likePost); // <-- إضافة المسار الجديد
// -------------------------------

module.exports = router;