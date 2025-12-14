const express = require('express');
const router = express.Router();
const {
  getVaccines,
  addVaccine,
  updateVaccine,
  deleteVaccine,
  seedVaccines, // 1️⃣ تأكد إنك استوردت الدالة دي
} = require('../controllers/vaccineController');

const { protect, authorize } = require('../middleware/authMiddleware');

// 🔥 2️⃣ لازم الرابط ده يكون في الأول قبل الـ /:id 🔥
router.post('/seed', protect, authorize('super_admin'), seedVaccines);

router
  .route('/')
  .get(getVaccines)
  .post(protect, authorize('super_admin'), addVaccine);

router
  .route('/:id')
  .put(protect, authorize('super_admin'), updateVaccine)
  .delete(protect, authorize('super_admin'), deleteVaccine);

module.exports = router;