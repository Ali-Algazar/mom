const express = require('express');
const router = express.Router();
const {
  addDiaryEntry,
  getChildDiaryEntries,
  updateDiaryEntry,
  deleteDiaryEntry,
} = require('../controllers/diaryEntryController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', addDiaryEntry);
router.get('/child/:childId', getChildDiaryEntries);
router.route('/:entryId')
  .put(updateDiaryEntry)
  .delete(deleteDiaryEntry);

module.exports = router;