// controllers/growthController.js

const asyncHandler = require('express-async-handler');
const GrowthRecord = require('../models/growthRecordModel');
const Child = require('../models/childModel'); // نحتاجه للتحقق من الملكية

/**
 * @desc    إضافة سجل نمو جديد
 * @route   POST /api/v1/growth
 * @access  Private
 */
const addGrowthRecord = asyncHandler(async (req, res) => {
  // المدخلات: ID الطفل، الوزن، الطول، ...
  const { child, weight, height, headCircumference, dateOfMeasurement, notes } =
    req.body;

  // التحقق من المدخلات الأساسية
  if (!child || !weight || !height || !dateOfMeasurement) {
    res.status(400);
    throw new Error('الرجاء إدخال بيانات الطفل، الوزن، الطول، وتاريخ القياس');
  }

  // --- (خطوة أمنية) ---
  // التأكد من أن الطفل يخص المستخدم المسجل دخوله
  const childDoc = await Child.findById(child);
  if (!childDoc) {
    res.status(404);
    throw new Error('لم يتم العثور على الطفل');
  }
  if (childDoc.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بإضافة سجلات لهذا الطفل');
  }

  // إنشاء السجل
  const record = await GrowthRecord.create({
    parent: req.user.id, // الربط بالأم
    child,
    weight,
    height,
    headCircumference,
    dateOfMeasurement,
    notes,
  });

  res.status(201).json(record);
});

/**
 * @desc    جلب كل سجلات النمو لطفل معين
 * @route   GET /api/v1/growth/child/:childId
 * @access  Private
 */
const getChildGrowthRecords = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  // --- (خطوة أمنية) ---
  const childDoc = await Child.findById(childId);
  if (!childDoc) {
    res.status(404);
    throw new Error('لم يتم العثور على الطفل');
  }
  if (childDoc.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بعرض هذه السجلات');
  }

  // جلب السجلات مرتبة بالتاريخ (الأحدث أولاً)
  const records = await GrowthRecord.find({ child: childId }).sort({
    dateOfMeasurement: 'desc',
  });

  res.status(200).json(records);
});

/**
 * @desc    تعديل سجل نمو
 * @route   PUT /api/v1/growth/:recordId
 * @access  Private
 */
const updateGrowthRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const record = await GrowthRecord.findById(recordId);

  if (!record) {
    res.status(404);
    throw new Error('لم يتم العثور على السجل');
  }

  // --- (خطوة أمنية) ---
  // التأكد من أن السجل يخص المستخدم
  if (record.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بتعديل هذا السجل');
  }

  const updatedRecord = await GrowthRecord.findByIdAndUpdate(
    recordId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedRecord);
});

/**
 * @desc    حذف سجل نمو
 * @route   DELETE /api/v1/growth/:recordId
 * @access  Private
 */
const deleteGrowthRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const record = await GrowthRecord.findById(recordId);

  if (!record) {
    res.status(404);
    throw new Error('لم يتم العثور على السجل');
  }

  // --- (خطوة أمنية) ---
  if (record.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بحذف هذا السجل');
  }

  await GrowthRecord.findByIdAndDelete(recordId);

  res.status(200).json({ success: true, message: 'تم حذف السجل بنجاح' });
});

module.exports = {
  addGrowthRecord,
  getChildGrowthRecords,
  updateGrowthRecord,
  deleteGrowthRecord,
};