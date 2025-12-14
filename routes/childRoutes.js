const express = require('express');
const router = express.Router();
const {
  createChild,
  getChildren,
  getChildById,
  updateChild,
  deleteChild,
} = require('../controllers/childController');

const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect); // حماية للكل

router
  .route('/')
  .get(getChildren) // الكل يشوف (بشروطه)
  .post(authorize('staff', 'super_admin'), createChild); // إضافة (موظف/وزارة)

router
  .route('/:id')
  .get(getChildById) // الكل يشوف تفاصيل (بشروطه)
  .put(authorize('staff', 'super_admin'), updateChild) // تعديل (موظف/وزارة)
  .delete(authorize('super_admin'), deleteChild); // حذف (وزارة فقط)

module.exports = router;