// routes/childRoutes.js

const express = require('express');
const router = express.Router();

// 1. استيراد الوظائف الجديدة
const {
  addChild,
  getMyChildren,
  updateChild,
  deleteChild,
} = require('../controllers/childController');

const { protect } = require('../middleware/authMiddleware');

// --- (الطريقة الاحترافية لتنظيم المسارات) ---

// المسارات التي لا تحتاج ID ( /api/v1/children )
router
  .route('/')
  .post(protect, addChild)      // POST /
  .get(protect, getMyChildren); // GET /

// المسارات التي تحتاج ID ( /api/v1/children/:id )
router
  .route('/:id')
  .put(protect, updateChild)      // PUT /:id
  .delete(protect, deleteChild);  // DELETE /:id

module.exports = router;