// controllers/dailyLogController.js

const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/dailyLogModel');
const Child = require('../models/childModel'); // نحتاجه للتحقق من الملكية

/**
 * @desc    إضافة سجل يومي جديد (رضاعة، حفاض، نوم)
 * @route   POST /api/v1/logs
 * @access  Private
 */
const addDailyLog = asyncHandler(async (req, res) => {
  const { child, logType, startTime, ...otherData } = req.body;

  // التحقق من المدخلات الأساسية
  if (!child || !logType || !startTime) {
    res.status(400);
    throw new Error('الرجاء إدخال بيانات الطفل، نوع السجل، ووقت البدء');
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
  const log = await DailyLog.create({
    parent: req.user.id, // الربط بالأم
    child,
    logType,
    startTime,
    ...otherData, // (باقي البيانات مثل quantity, diaperType, etc.)
  });

  res.status(201).json(log);
});

/**
 * @desc    جلب كل السجلات اليومية لطفل معين
 * @route   GET /api/v1/logs/child/:childId
 * @access  Private
 */
const getChildDailyLogs = asyncHandler(async (req, res) => {
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

  // --- (الفلترة) ---
  let query = { child: childId };
  // السماح بالفلترة حسب نوع السجل
  // مثال: GET /api/v1/logs/child/:childId?type=feeding
  if (req.query.type) {
    query.logType = req.query.type;
  }

  // جلب السجلات مرتبة بالتاريخ (الأحدث أولاً)
  const logs = await DailyLog.find(query).sort({
    startTime: 'desc',
  });

  res.status(200).json(logs);
});

/**
 * @desc    تعديل سجل يومي
 * @route   PUT /api/v1/logs/:logId
 * @access  Private
 */
const updateDailyLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  const log = await DailyLog.findById(logId);

  if (!log) {
    res.status(404);
    throw new Error('لم يتم العثور على السجل');
  }

  // --- (خطوة أمنية) ---
  // التأكد من أن السجل يخص المستخدم
  if (log.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بتعديل هذا السجل');
  }

  const updatedLog = await DailyLog.findByIdAndUpdate(
    logId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedLog);
});

/**
 * @desc    حذف سجل يومي
 * @route   DELETE /api/v1/logs/:logId
 * @access  Private
 */
const deleteDailyLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  const log = await DailyLog.findById(logId);

  if (!log) {
    res.status(404);
    throw new Error('لم يتم العثور على السجل');
  }

  // --- (خطوة أمنية) ---
  if (log.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بحذف هذا السجل');
  }

  await DailyLog.findByIdAndDelete(logId);

  res.status(200).json({ success: true, message: 'تم حذف السجل بنجاح' });
});

module.exports = {
  addDailyLog,
  getChildDailyLogs,
  updateDailyLog,
  deleteDailyLog,
};