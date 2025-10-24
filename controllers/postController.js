// controllers/postController.js

const asyncHandler = require('express-async-handler');
const Post = require('../models/postModel');
const Comment = require('../models/commentModel');

/**
 * @desc    إنشاء بوست جديد
 * @route   POST /api/v1/posts
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  if (!content) {
    res.status(400); throw new Error('الرجاء إدخال محتوى البوست');
  }
  const post = await Post.create({ title, content, author: req.user.id });
  res.status(201).json(post);
});

/**
 * @desc    جلب كل البوستات (الأحدث أولاً)
 * @route   GET /api/v1/posts
 * @access  Private
 */
const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'name')
    .sort({ createdAt: 'desc' });
  res.status(200).json(posts);
});

/**
 * @desc    جلب بوست واحد مع كومنتاته
 * @route   GET /api/v1/posts/:postId
 * @access  Private
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId).populate('author', 'name');
  if (!post) {
    res.status(404); throw new Error('لم يتم العثور على البوست');
  }
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'name').sort({ createdAt: 'asc' });
  res.status(200).json({ post, comments, commentCount: comments.length });
});

/**
 * @desc    حذف بوست (للأدمن أو صاحب البوست)
 * @route   DELETE /api/v1/posts/:postId
 * @access  Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    res.status(404); throw new Error('لم يتم العثور على البوست');
  }
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401); throw new Error('غير مصرح لك بحذف هذا البوست');
  }
  await Comment.deleteMany({ post: req.params.postId });
  await Post.findByIdAndDelete(req.params.postId);
  res.status(200).json({ success: true, message: 'تم حذف البوست بنجاح' });
});

// --- (الوظيفة الجديدة للإعجاب/إلغاء الإعجاب) ---
/**
 * @desc    الإعجاب أو إلغاء الإعجاب ببوست
 * @route   PUT /api/v1/posts/:postId/like
 * @access  Private
 */
const likePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);

    if (!post) {
        res.status(404);
        throw new Error('لم يتم العثور على البوست');
    }

    // هل المستخدم عمل لايك قبل كده؟ (ابحث عن ID المستخدم في قائمة اللايكات)
    const alreadyLiked = post.likes.some(like => like.equals(req.user.id));

    if (alreadyLiked) {
        // --- إلغاء الإعجاب (Unlike) ---
        // شيل ID المستخدم من قائمة اللايكات
        post.likes = post.likes.filter(like => !like.equals(req.user.id));
        await post.save();
        res.status(200).json({ message: 'تم إلغاء الإعجاب', likes: post.likes });
    } else {
        // --- الإعجاب (Like) ---
        // ضيف ID المستخدم لقائمة اللايكات
        post.likes.push(req.user.id);
        await post.save();
        res.status(200).json({ message: 'تم الإعجاب بالبوست', likes: post.likes });
    }
});
// ------------------------------------------------

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likePost, // <-- إضافة الوظيفة الجديدة
};