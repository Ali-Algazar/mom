const express = require('express');
const router = express.Router();
const {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} = require('../controllers/recipeController');

const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .post(protect, authorize('super_admin'), createRecipe) // الوزارة فقط
  .get(getAllRecipes); // للجميع

router
  .route('/:id')
  .get(getRecipeById)
  .put(protect, authorize('super_admin'), updateRecipe)
  .delete(protect, authorize('super_admin'), deleteRecipe);

module.exports = router;