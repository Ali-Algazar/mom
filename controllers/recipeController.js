// controllers/recipeController.js

const asyncHandler = require('express-async-handler');
const Recipe = require('../models/recipeModel');

/**
 * @desc    إنشاء وصفة جديدة (للأدمن)
 * @route   POST /api/v1/recipes
 * @access  Private/Admin
 */
const createRecipe = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    ingredients,
    instructions,
    ageGroup,
    category,
    warnings,
    imageUrl,
  } = req.body;

  // التحقق من الحقول الأساسية
  if (!title || !ingredients || !instructions || !ageGroup) {
    res.status(400);
    throw new Error(
      'الرجاء إدخال العنوان، المكونات، طريقة التحضير، والفئة العمرية'
    );
  }

  const recipe = await Recipe.create({
    title,
    description,
    ingredients,
    instructions,
    ageGroup,
    category,
    warnings,
    imageUrl,
    addedBy: req.user.id, // الربط بالأدمن
  });

  res.status(201).json(recipe);
});

/**
 * @desc    جلب جميع الوصفات (مع فلترة)
 * @route   GET /api/v1/recipes
 * @access  Public
 */
const getAllRecipes = asyncHandler(async (req, res) => {
  let query = {};

  // الفلترة بالفئة العمرية
  // مثال: GET /api/v1/recipes?ageGroup=6-8m
  if (req.query.ageGroup) {
    query.ageGroup = req.query.ageGroup;
  }

  // الفلترة بالتصنيف
  // مثال: GET /api/v1/recipes?category=breakfast
  if (req.query.category) {
    query.category = req.query.category;
  }

  const recipes = await Recipe.find(query)
    .populate('addedBy', 'name') // جلب اسم الأدمن
    .sort({ createdAt: 'desc' }); // الأحدث أولاً

  res.status(200).json(recipes);
});

/**
 * @desc    جلب وصفة واحدة عن طريق ID
 * @route   GET /api/v1/recipes/:id
 * @access  Public
 */
const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id).populate('addedBy', 'name');

  if (recipe) {
    res.status(200).json(recipe);
  } else {
    res.status(404);
    throw new Error('لم يتم العثور على الوصفة');
  }
});

/**
 * @desc    تعديل وصفة (للأدمن)
 * @route   PUT /api/v1/recipes/:id
 * @access  Private/Admin
 */
const updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error('لم يتم العثور على الوصفة');
  }

  const updatedRecipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updatedRecipe);
});

/**
 * @desc    حذف وصفة (للأدمن)
 * @route   DELETE /api/v1/recipes/:id
 * @access  Private/Admin
 */
const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (!recipe) {
    res.status(404);
    throw new Error('لم يتم العثور على الوصفة');
  }

  await Recipe.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'تم حذف الوصفة بنجاح' });
});

module.exports = {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
};