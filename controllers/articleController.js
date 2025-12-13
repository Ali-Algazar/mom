const Article = require('../models/articleModel'); // تأكد إن الموديل موجود
const asyncHandler = require('express-async-handler');

// @desc    جلب كل المقالات
// @route   GET /api/v1/articles
// @access  Public
const getArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.status(200).json(articles);
});

// @desc    جلب مقال واحد
// @route   GET /api/v1/articles/:id
// @access  Public
const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article) {
    res.status(404);
    throw new Error('المقال غير موجود');
  }
  res.status(200).json(article);
});

// @desc    إضافة مقال جديد
// @route   POST /api/v1/articles
// @access  Private (Super Admin)
const createArticle = asyncHandler(async (req, res) => {
  const { title, content, imageUrl, category } = req.body;

  if (!title || !content) {
    res.status(400);
    throw new Error('يرجى إضافة العنوان والمحتوى');
  }

  const article = await Article.create({
    title,
    content,
    imageUrl,
    category,
    user: req.user._id, // الموظف/الأدمن اللي كتب المقال
  });

  res.status(201).json(article);
});

// @desc    تعديل مقال
// @route   PUT /api/v1/articles/:id
// @access  Private (Super Admin)
const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('المقال غير موجود');
  }

  const updatedArticle = await Article.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedArticle);
});

// @desc    حذف مقال
// @route   DELETE /api/v1/articles/:id
// @access  Private (Super Admin)
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('المقال غير موجود');
  }

  await article.deleteOne();
  res.status(200).json({ message: 'تم حذف المقال بنجاح' });
});

// 🔥 تصدير الدوال بنفس الأسماء اللي استخدمناها في الـ Route 🔥
module.exports = {
  getArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
};