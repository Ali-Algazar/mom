// routes/childRoutes.js

const express = require('express');
const router = express.Router();
const {
  createChild,
  getChildren,
  // updateChild, deleteChild... (لو موجودين عندك)
} = require('../controllers/childController');

const { protect, authorize } = require('../middleware/authMiddleware');

// حماية كل المسارات اللي جاية
router.use(protect);

router
  .route('/')
  .get(getChildren) // مفتوح للأم (تشوف ولادها) وللموظف (يشوف ولاد وحدته)
  .post(
      authorize('staff', 'super_admin'), // 🔥 إضافة طفل: للموظفين والوزارة فقط 🔥
      createChild
  );

// لو عندك مسارات تانية زي التعديل والحذف:
/*
router
  .route('/:id')
  .put(authorize('staff', 'super_admin'), updateChild) // التعديل للموظف
  .delete(authorize('super_admin'), deleteChild);      // الحذف للوزارة بس (مثلاً)
*/

module.exports = router;