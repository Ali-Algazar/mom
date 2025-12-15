const asyncHandler = require('express-async-handler');
const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

/**
 * @desc    إضافة كومنت جديد على بوست
 * @route   POST /api/v1/comments/:postId
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
        res.status(400); throw new Error('الرجاء إدخال محتوى الكومنت');
    }

    const postExists = await Post.findById(postId);
    if (!postExists) {
        res.status(404); throw new Error('لم يتم العثور على البوست');
    }

    const comment = await Comment.create({
        content,
        author: req.user._id,
        post: postId,
    });

    // تحديث عداد الكومنتات في البوست
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'name avatar'); // زودت avatar عشان الفرونت

    res.status(201).json(populatedComment);
});

/**
 * @desc    حذف كومنت
 * @route   DELETE /api/v1/comments/:commentId
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
        res.status(404); throw new Error('لم يتم العثور على الكومنت');
    }

    // 🔥 التعديل هنا: التحقق من السوبر أدمن 🔥
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
        res.status(401); throw new Error('غير مصرح لك بحذف هذا الكومنت');
    }

    const postId = comment.post;

    await Comment.findByIdAndDelete(req.params.commentId);

    // إنقاص العداد
    const post = await Post.findById(postId);
    if (post && post.commentCount > 0) {
       await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
    }

    res.status(200).json({ success: true, message: 'تم حذف الكومنت بنجاح' });
});

module.exports = {
    addComment,
    deleteComment,
};