// controllers/medicineController.js

const asyncHandler = require('express-async-handler');
const Medicine = require('../models/medicineModel');

/**
 * @desc    إضافة دواء جديد
 * @route   POST /api/v1/medicines
 * @access  Private/Admin
 */
const createMedicine = asyncHandler(async (req, res) => {
  const { name, description, category, usage, sideEffects , imageUrl } = req.body;

  if (!name || !description || !category || !usage) {
    res.status(400);
    throw new Error('الرجاء إدخال الاسم، الوصف، التصنيف، وطريقة الاستخدام');
  }

  const medicine = await Medicine.create({
    name,
    description,
    category,
    usage,
    sideEffects,
    imageUrl,
    addedBy: req.user.id, // الربط بالأدمن الذي أنشأه
  });

  res.status(201).json(medicine);
});

/**
 * @desc    جلب جميع الأدوية (مع فلترة وبحث)
 * @route   GET /api/v1/medicines
 * @access  Public
 */
const getAllMedicines = asyncHandler(async (req, res) => {
  let query = {}; // فلتر البحث

  // 1. الفلترة بالتصنيف
  // مثال: GET /api/v1/medicines?category=fever
  if (req.query.category) {
    query.category = req.query.category;
  }

  // 2. البحث بالاسم
  // مثال: GET /api/v1/medicines?search=panadol
  if (req.query.search) {
    query.name = {
      $regex: req.query.search, // بحث "يحتوي على"
      $options: 'i', // غير حساس لحالة الأحرف (small/capital)
    };
  }

  // .populate('addedBy', 'name') -> لجلب اسم الأدمن
  const medicines = await Medicine.find(query)
    .populate('addedBy', 'name')
    .sort({ name: 'asc' }); // ترتيب أبجدي

  res.status(200).json(medicines);
});

/**
 * @desc    جلب دواء واحد عن طريق ID
 * @route   GET /api/v1/medicines/:id
 * @access  Public
 */
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id).populate('addedBy', 'name');

  if (medicine) {
    res.status(200).json(medicine);
  } else {
    res.status(404);
    throw new Error('لم يتم العثور على الدواء');
  }
});

/**
 * @desc    تعديل دواء
 * @route   PUT /api/v1/medicines/:id
 * @access  Private/Admin
 */
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('لم يتم العثور على الدواء');
  }

  const updatedMedicine = await Medicine.findByIdAndUpdate(
    req.params.id,
    req.body, // البيانات الجديدة
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedMedicine);
});

/**
 * @desc    حذف دواء
 * @route   DELETE /api/v1/medicines/:id
 * @access  Private/Admin
 */
const deleteMedicine = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);

  if (!medicine) {
    res.status(404);
    throw new Error('لم يتم العثور على الدواء');
  }

  await Medicine.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'تم حذف الدواء بنجاح' });
});


module.exports = {
  createMedicine,
  getAllMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
};