// controllers/commentController.js

const asyncHandler = require('express-async-handler');
const Comment = require('../models/commentModel');
const Post = require('../models/postModel');

/**
 * @desc    إضافة كومنت جديد على بوست
 * @route   POST /api/v1/posts/:postId/comments
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { postId } = req.params;

    if (!content) {
        res.status(400);
        throw new Error('الرجاء إدخال محتوى الكومنت');
    }

    // التأكد إن البوست موجود
    const postExists = await Post.findById(postId);
    if (!postExists) {
        res.status(404);
        throw new Error('لم يتم العثور على البوست');
    }

    // إنشاء الكومنت
    const comment = await Comment.create({
        content,
        author: req.user.id,
        post: postId,
    });

    // --- (1. تحديث عدد الكومنتات في البوست - الطريقة الأضمن) ---
    // استخدم $inc لزيادة العداد بواحد بشكل آمن
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });
    // ----------------------------------------------------

    const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'name');

    res.status(201).json(populatedComment);
});

/**
 * @desc    حذف كومنت (للأدمن أو صاحب الكومنت)
 * @route   DELETE /api/v1/comments/:commentId
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
        res.status(404);
        throw new Error('لم يتم العثور على الكومنت');
    }

    // التحقق من الملكية أو الأدمن
    if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('غير مصرح لك بحذف هذا الكومنت');
    }

    const postId = comment.post; // حفظ ID البوست قبل حذف الكومنت

    // حذف الكومنت
    await Comment.findByIdAndDelete(req.params.commentId);

    // --- (2. تحديث عدد الكومنتات في البوست - الطريقة الأضمن) ---
    // استخدم $inc لإنقاص العداد بواحد (ونتأكد إنه ميبقاش سالب)
    // Check if the post still exists before trying to update
     const post = await Post.findById(postId);
     if (post && post.commentCount > 0) { // Check if count is positive
       await Post.findByIdAndUpdate(postId, { $inc: { commentCount: -1 } });
     } else if (post && post.commentCount <= 0) {
        // Optional: Ensure count doesn't go negative if already 0 for some reason
        await Post.findByIdAndUpdate(postId, { commentCount: 0 });
     }
    // ----------------------------------------------------

    res.status(200).json({ success: true, message: 'تم حذف الكومنت بنجاح' });
});

module.exports = {
    addComment,
    deleteComment,
};