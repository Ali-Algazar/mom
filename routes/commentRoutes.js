const express = require('express');
const router = express.Router();
const { addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // حماية لكل الروابط

// إضافة كومنت (بنبعت ID البوست)
// الرابط النهائي: /api/v1/comments/:postId
router.post('/:postId', addComment);

// حذف كومنت (بنبعت ID الكومنت)
// الرابط النهائي: /api/v1/comments/:commentId
router.delete('/:commentId', deleteComment);

module.exports = router;