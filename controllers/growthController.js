const asyncHandler = require('express-async-handler');
const GrowthRecord = require('../models/growthRecordModel');
const Child = require('../models/childModel');

/**
 * @desc    إضافة سجل نمو جديد
 * @route   POST /api/v1/growth
 * @access  Private (الأم فقط)
 */
const addGrowthRecord = asyncHandler(async (req, res) => {
  const { child, weight, height, headCircumference, dateOfMeasurement, notes } = req.body;

  if (!child || !weight || !height || !dateOfMeasurement) {
    res.status(400); throw new Error('بيانات ناقصة (الطفل، الوزن، الطول، التاريخ)');
  }

  const childDoc = await Child.findById(child);
  if (!childDoc) {
    res.status(404); throw new Error('لم يتم العثور على الطفل');
  }

  // التحقق: الأم فقط
  if (childDoc.parentUser.toString() !== req.user._id.toString()) {
    res.status(401); throw new Error('غير مصرح لك بإضافة سجلات لهذا الطفل');
  }

  const record = await GrowthRecord.create({
    parentUser: req.user._id, // 🔥
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
 * @desc    جلب سجلات نمو طفل
 * @route   GET /api/v1/growth/child/:childId
 * @access  Private (الأم والوزارة)
 */
const getChildGrowthRecords = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  const childDoc = await Child.findById(childId);
  if (!childDoc) {
    res.status(404); throw new Error('لم يتم العثور على الطفل');
  }

  // الحماية: الأم أو الأدمن
  const isParent = childDoc.parentUser.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'super_admin';

  if (!isParent && !isAdmin) {
    res.status(401); throw new Error('غير مصرح لك بعرض هذه السجلات');
  }

  const records = await GrowthRecord.find({ child: childId }).sort({
    dateOfMeasurement: -1,
  });

  res.status(200).json(records);
});

/**
 * @desc    تعديل سجل نمو
 * @route   PUT /api/v1/growth/:recordId
 * @access  Private (الأم فقط)
 */
const updateGrowthRecord = asyncHandler(async (req, res) => {
  const record = await GrowthRecord.findById(req.params.recordId);

  if (!record) {
    res.status(404); throw new Error('السجل غير موجود');
  }

  // الأم فقط
  if (record.parentUser.toString() !== req.user._id.toString()) {
    res.status(401); throw new Error('غير مصرح لك بتعديل هذا السجل');
  }

  const updatedRecord = await GrowthRecord.findByIdAndUpdate(
    req.params.recordId,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedRecord);
});

/**
 * @desc    حذف سجل نمو
 * @route   DELETE /api/v1/growth/:recordId
 * @access  Private (الأم والوزارة)
 */
const deleteGrowthRecord = asyncHandler(async (req, res) => {
  const record = await GrowthRecord.findById(req.params.recordId);

  if (!record) {
    res.status(404); throw new Error('السجل غير موجود');
  }

  // الأم أو الأدمن
  if (record.parentUser.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    res.status(401); throw new Error('غير مصرح لك بحذف هذا السجل');
  }

  await record.deleteOne();
  res.status(200).json({ success: true, message: 'تم الحذف' });
});

module.exports = {
  addGrowthRecord,
  getChildGrowthRecords,
  updateGrowthRecord,
  deleteGrowthRecord,
};