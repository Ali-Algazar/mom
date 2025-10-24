// routes/diaryEntryRoutes.js

const express = require('express');
const router = express.Router();
const {
  addDiaryEntry,
  getChildDiaryEntries,
  updateDiaryEntry,
  deleteDiaryEntry,
} = require('../controllers/diaryEntryController');

const { protect } = require('../middleware/authMiddleware');

// --- (تنظيم المسارات) ---

// إضافة سجل يوميات جديد
// POST /api/v1/diary
router.post('/', protect, addDiaryEntry);

// جلب كل سجلات طفل معين
// GET /api/v1/diary/child/:childId
router.get('/child/:childId', protect, getChildDiaryEntries);

// تعديل أو حذف سجل معين
// PUT & DELETE /api/v1/diary/:entryId
router
  .route('/:entryId')
  .put(protect, updateDiaryEntry)
  .delete(protect, deleteDiaryEntry);

module.exports = router;