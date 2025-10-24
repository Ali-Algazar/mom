// routes/recipeRoutes.js

const express = require('express');
const router = express.Router();
const {
  createRecipe,
  getAllRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} = require('../controllers/recipeController');

const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// المسارات التي لا تحتاج ID ( /api/v1/recipes )
router
  .route('/')
  .post(protect, admin, createRecipe) // للأدمن فقط
  .get(getAllRecipes); // للجميع

// المسارات التي تحتاج ID ( /api/v1/recipes/:id )
router
  .route('/:id')
  .get(getRecipeById) // للجميع
  .put(protect, admin, updateRecipe) // للأدمن فقط
  .delete(protect, admin, deleteRecipe); // للأدمن فقط

module.exports = router;