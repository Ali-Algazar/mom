// controllers/scheduleController.js

const asyncHandler = require('express-async-handler');
const ChildVaccination = require('../models/childVaccinationModel');
const Child = require('../models/childModel');

/**
 * @desc    جلب جدول تطعيمات طفل معين
 * @route   GET /api/v1/schedule/:childId
 * @access  Private
 */
const getChildSchedule = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  // 1. --- (خطوة أمنية) ---
  // التأكد من أن الطفل يخص المستخدم المسجل دخوله
  const child = await Child.findById(childId);

  if (!child) {
    res.status(404);
    throw new Error('لم يتم العثور على الطفل');
  }

  // التحقق من الملكية
  if (child.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك، هذا الطفل لا يخصك');
  }

  // 2. --- (جلب البيانات) ---
  const schedule = await ChildVaccination.find({ child: childId })
    .populate('vaccine', 'name description doseInfo ageInMonths')
    .sort({ dueDate: 'asc' });
  
  if (!schedule) {
    res.status(404);
    throw new Error('لم يتم العثور على جدول تطعيمات لهذا الطفل');
  }

  // 3. إرسال الرد
  res.status(200).json(schedule);
});


/**
 * @desc    تحديث حالة سجل تطعيم (مثل: تم أخذه)
 * @route   PUT /api/v1/schedule/:scheduleId
 * @access  Private
 */
const updateScheduleItem = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const { status, dateAdministered, notes } = req.body; // البيانات الجديدة

  // 1. العثور على سجل التطعيم المحدد
  const scheduleItem = await ChildVaccination.findById(scheduleId);

  if (!scheduleItem) {
    res.status(404);
    throw new Error('لم يتم العثور على سجل التطعيم هذا');
  }

  // 2. --- (خطوة أمنية) ---
  // التأكد من أن هذا السجل يخص المستخدم المسجل دخوله
  if (scheduleItem.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بتعديل هذا السجل');
  }

  // 3. تحديث البيانات
  scheduleItem.status = status || scheduleItem.status;
  scheduleItem.dateAdministered = dateAdministered || scheduleItem.dateAdministered;
  scheduleItem.notes = notes || scheduleItem.notes;
  
  // (إذا تم تغيير الحالة إلى "pending" مرة أخرى، يجب مسح تاريخ الإعطاء)
  if (status && status === 'pending') {
    scheduleItem.dateAdministered = undefined; // أو null
  }

  const updatedItem = await scheduleItem.save();

  // 4. إرسال الرد
  res.status(200).json(updatedItem);
});


module.exports = {
  getChildSchedule,
  updateScheduleItem, // <-- إضافة جديدة
};