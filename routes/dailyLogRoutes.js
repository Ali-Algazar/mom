const express = require('express');
const router = express.Router();
const {
  addDailyLog,
  getChildDailyLogs,
  updateDailyLog,
  deleteDailyLog,
} = require('../controllers/dailyLogController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect); // تفعيل الحماية

router.post('/', addDailyLog);
router.get('/child/:childId', getChildDailyLogs);
router.route('/:logId')
  .put(updateDailyLog)
  .delete(deleteDailyLog);

module.exports = router;