const express = require('express');
const router = express.Router();
const {
  addGrowthRecord,
  getChildGrowthRecords,
  updateGrowthRecord,
  deleteGrowthRecord,
} = require('../controllers/growthController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', addGrowthRecord);
router.get('/child/:childId', getChildGrowthRecords);
router.route('/:recordId')
  .put(updateGrowthRecord)
  .delete(deleteGrowthRecord);

module.exports = router;