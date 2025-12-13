const express = require('express');
const router = express.Router();
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require('../controllers/recipeController');

// 🔥 التصحيح 🔥
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getRecipes)
  .post(protect, authorize('super_admin'), createRecipe);

router.route('/:id')
  .get(getRecipeById)
  .put(protect, authorize('super_admin'), updateRecipe)
  .delete(protect, authorize('super_admin'), deleteRecipe);

module.exports = router;