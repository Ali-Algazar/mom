const express = require('express');
const router = express.Router();
const {
  getChildSchedule,
  markAsTaken,
  undoVaccination
} = require('../controllers/recordController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // حماية لكل الروابط

// جلب جدول الطفل (للأم والموظف)
router.get('/child/:childId', getChildSchedule);

// تسجيل التطعيم (للموظف والأدمن بس)
router.put('/:id', authorize('staff', 'super_admin'), markAsTaken);

// التراجع عن التطعيم (للموظف والأدمن بس)
router.put('/:id/undo', authorize('staff', 'super_admin'), undoVaccination);

module.exports = router;