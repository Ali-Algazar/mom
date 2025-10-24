
const asyncHandler = require('express-async-handler');
const Article = require('../models/articleModel');

/**
 * @desc    Create a new article
 * @route   POST /api/v1/articles
 * @access  Private/Admin
 */
const createArticle = asyncHandler(async (req, res) => {
  const { title, content, category, imageUrl } = req.body;

  if (!title || !content || !category) {
    res.status(400);
    throw new Error('Please provide title, content, and category');
  }

  const article = await Article.create({
    title,
    content,
    category,
    imageUrl, 
    author: req.user.id, 
  });

  res.status(201).json(article);
});

/**
 * @desc    Get all articles (can be filtered by category)
 * @route   GET /api/v1/articles
 * @access  Public
 */
const getAllArticles = asyncHandler(async (req, res) => {
  let query = {};

  if (req.query.category) {
    query.category = req.query.category;
  }


  const articles = await Article.find(query)
    .populate('author', 'name')
    .sort({ createdAt: 'desc' });

  res.status(200).json(articles);
});

/**
 * @desc    Get a single article by ID
 * @route   GET /api/v1/articles/:id
 * @access  Public
 */
const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id).populate('author', 'name');

  if (article) {
    res.status(200).json(article);
  } else {
    res.status(404);
    throw new Error('Article not found');
  }
});

/**
 * @desc    Update an article
 * @route   PUT /api/v1/articles/:id
 * @access  Private/Admin
 */
const updateArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  const updatedArticle = await Article.findByIdAndUpdate(
    req.params.id,
    req.body, 
    {
      new: true, 
      runValidators: true, 
    }
  ).populate('author', 'name'); 

  res.status(200).json(updatedArticle);
});


/**
 * @desc    Delete an article
 * @route   DELETE /api/v1/articles/:id
 * @access  Private/Admin
 */
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article) {
    res.status(404);
    throw new Error('Article not found');
  }

  await Article.findByIdAndDelete(req.params.id); 

  res.status(200).json({ success: true, message: 'Article deleted successfully' });
});


module.exports = {
  createArticle,
  getAllArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
};