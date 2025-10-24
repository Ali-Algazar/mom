// controllers/vaccineController.js

const asyncHandler = require('express-async-handler');
const Vaccine = require('../models/vaccineModel'); // استيراد نموذج التطعيم

/**
 * @desc    إضافة تطعيم جديد (للأدمن فقط)
 * @route   POST /api/v1/vaccines
 * @access  Private/Admin
 */
const createVaccine = asyncHandler(async (req, res) => {
  // 1. استلام البيانات من الـ body
  const { name, description, ageInMonths, doseInfo } = req.body;

  // 2. التحقق
  if (!name || !description || ageInMonths === undefined) {
    res.status(400);
    throw new Error('الرجاء إدخال الاسم، الوصف، وعمر التطعيم بالأشهر');
  }

  // 3. التحقق مما إذا كان التطعيم موجوداً من قبل
  const vaccineExists = await Vaccine.findOne({ name });
  if (vaccineExists) {
    res.status(400);
    throw new Error('هذا التطعيم مسجل مسبقاً');
  }

  // 4. إنشاء التطعيم
  const vaccine = await Vaccine.create({
    name,
    description,
    ageInMonths,
    doseInfo,
  });

  res.status(201).json(vaccine);
});

/**
 * @desc    جلب جميع التطعيمات من القائمة الرئيسية
 * @route   GET /api/v1/vaccines
 * @access  Public (عام للجميع)
 */
const getAllVaccines = asyncHandler(async (req, res) => {
  // جلب كل التطعيمات وترتيبها حسب العمر (من الأصغر للأكبر)
  const vaccines = await Vaccine.find({}).sort({ ageInMonths: 'asc' });
  res.status(200).json(vaccines);
});

/**
 * @desc    تعديل تطعيم (للأدمن فقط)
 * @route   PUT /api/v1/vaccines/:id
 * @access  Private/Admin
 */
const updateVaccine = asyncHandler(async (req, res) => {
  const vaccine = await Vaccine.findById(req.params.id);

  if (!vaccine) {
    res.status(440);
    throw new Error('لم يتم العثور على التطعيم');
  }

  // (req.body) هي البيانات الجديدة
  const updatedVaccine = await Vaccine.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedVaccine);
});

/**
 * @desc    حذف تطعيم (للأدمن فقط)
 * @route   DELETE /api/v1/vaccines/:id
 * @access  Private/Admin
 */
const deleteVaccine = asyncHandler(async (req, res) => {
  const vaccine = await Vaccine.findById(req.params.id);

  if (!vaccine) {
    res.status(404);
    throw new Error('لم يتم العثور على التطعيم');
  }
  
  await Vaccine.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'تم حذف التطعيم بنجاح',
  });
});


// 4. تحديث سطر "module.exports"
module.exports = {
  createVaccine,
  getAllVaccines, // <-- إضافة جديدة
  updateVaccine,  // <-- إضافة جديدة
  deleteVaccine,  // <-- إضافة جديدة
};