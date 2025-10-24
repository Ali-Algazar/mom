// routes/commentRoutes.js

const express = require('express');
const router = express.Router();
const { deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// مسار لحذف كومنت معين
// DELETE /api/v1/comments/:commentId
router.delete('/:commentId', protect, deleteComment); // (محمي)

module.exports = router;