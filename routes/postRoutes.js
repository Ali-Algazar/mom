const express = require('express');
const router = express.Router();
const {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likePost,
} = require('../controllers/postController');

// بنجيب دالة إضافة الكومنت من الكنترولر التاني عشان نربطها هنا
const { addComment } = require('../controllers/commentController');

const { protect } = require('../middleware/authMiddleware');

// كل البوستات محتاجة تسجيل دخول
router.use(protect);

router
  .route('/')
  .post(createPost)
  .get(getAllPosts);

router
  .route('/:postId')
  .get(getPostById)
  .delete(deletePost);

// مسار اللايك
router.put('/:postId/like', likePost);

// مسار إضافة كومنت على البوست
router.post('/:postId/comments', addComment);

module.exports = router;