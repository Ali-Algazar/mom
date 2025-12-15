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
  const post = await Post.create({ 
      title, 
      content, 
      author: req.user._id // استخدام _id
  });
  
  // إعادة البوست مع بيانات الكاتب
  const fullPost = await Post.findById(post._id).populate('author', 'name avatar');
  res.status(201).json(fullPost);
});

/**
 * @desc    جلب كل البوستات
 * @route   GET /api/v1/posts
 * @access  Private
 */
const getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({})
    .populate('author', 'name avatar') // ضيفنا الصورة لو موجودة
    .sort({ createdAt: -1 });
  res.status(200).json(posts);
});

/**
 * @desc    جلب بوست واحد
 * @route   GET /api/v1/posts/:postId
 * @access  Private
 */
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId).populate('author', 'name avatar');
  if (!post) {
    res.status(404); throw new Error('لم يتم العثور على البوست');
  }
  // جلب الكومنتات المرتبطة
  const comments = await Comment.find({ post: req.params.postId })
    .populate('author', 'name avatar')
    .sort({ createdAt: 1 });
    
  res.status(200).json({ post, comments, commentCount: comments.length });
});

/**
 * @desc    حذف بوست
 * @route   DELETE /api/v1/posts/:postId
 * @access  Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) {
    res.status(404); throw new Error('لم يتم العثور على البوست');
  }
  
  // الحماية: صاحب البوست أو السوبر أدمن
  if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    res.status(401); throw new Error('غير مصرح لك بحذف هذا البوست');
  }
  
  await Comment.deleteMany({ post: req.params.postId });
  await Post.findByIdAndDelete(req.params.postId);
  
  res.status(200).json({ success: true, message: 'تم حذف البوست بنجاح' });
});

/**
 * @desc    الإعجاب / إلغاء الإعجاب
 * @route   PUT /api/v1/posts/:postId/like
 * @access  Private
 */
const likePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);

    if (!post) {
        res.status(404); throw new Error('لم يتم العثور على البوست');
    }

    // هل المستخدم عمل لايك قبل كده؟
    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
        // إلغاء الإعجاب (Unlike)
        // بنستخدم pull عشان نشيل العنصر من المصفوفة بسهولة
        post.likes.pull(req.user._id);
    } else {
        // إعجاب (Like)
        post.likes.push(req.user._id);
    }

    await post.save();
    res.status(200).json({ message: 'تم التحديث', likes: post.likes });
});

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  deletePost,
  likePost,
};