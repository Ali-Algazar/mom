const Recipe = require('../models/recipeModel');
const asyncHandler = require('express-async-handler');

const getRecipes = asyncHandler(async (req, res) => {
  const recipes = await Recipe.find({});
  res.status(200).json(recipes);
});

const getRecipeById = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) { res.status(404); throw new Error('الوصفة غير موجودة'); }
  res.status(200).json(recipe);
});

const createRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.create(req.body);
  res.status(201).json(recipe);
});

const updateRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(recipe);
});

const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) { res.status(404); throw new Error('غير موجودة'); }
  await recipe.deleteOne();
  res.status(200).json({ message: 'تم الحذف' });
});

module.exports = {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
};