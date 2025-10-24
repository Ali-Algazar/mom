// routes/soundRoutes.js

const express = require('express');
const router = express.Router();
const {
  createSound,
  getAllSounds,
  getSoundById,
  updateSound,
  deleteSound,
} = require('../controllers/soundController');

const { protect, admin } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// المسارات التي لا تحتاج ID ( /api/v1/sounds )
router
  .route('/')
  .post(protect, admin, createSound) // للأدمن فقط
  .get(getAllSounds); // للجميع

// المسارات التي تحتاج ID ( /api/v1/sounds/:id )
router
  .route('/:id')
  .get(getSoundById) // للجميع
  .put(protect, admin, updateSound) // للأدمن فقط
  .delete(protect, admin, deleteSound); // للأدمن فقط

module.exports = router;