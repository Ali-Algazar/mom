const asyncHandler = require('express-async-handler');
const DailyLog = require('../models/dailyLogModel');
const Child = require('../models/childModel');

/**
 * @desc    إضافة سجل يومي جديد (رضاعة، حفاض، نوم)
 * @route   POST /api/v1/logs
 * @access  Private (الأم فقط)
 */
const addDailyLog = asyncHandler(async (req, res) => {
  const { child, logType, startTime, ...otherData } = req.body;

  if (!child || !logType || !startTime) {
    res.status(400); throw new Error('بيانات ناقصة (الطفل، النوع، وقت البدء)');
  }

  const childDoc = await Child.findById(child);
  if (!childDoc) {
    res.status(404); throw new Error('لم يتم العثور على الطفل');
  }

  // 🔥 التعديل هنا: parentUser بدلاً من parent 🔥
  if (childDoc.parentUser.toString() !== req.user._id.toString()) {
    res.status(401); throw new Error('غير مصرح لك بإضافة سجلات لهذا الطفل');
  }

  const log = await DailyLog.create({
    parentUser: req.user._id, // حفظنا الأم
    child,
    logType,
    startTime,
    ...otherData,
  });

  res.status(201).json(log);
});

/**
 * @desc    جلب سجلات طفل
 * @route   GET /api/v1/logs/child/:childId
 * @access  Private (الأم والوزارة)
 */
const getChildDailyLogs = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  const childDoc = await Child.findById(childId);
  if (!childDoc) {
    res.status(404); throw new Error('لم يتم العثور على الطفل');
  }

  // الحماية: الأم صاحبة الطفل أو السوبر أدمن
  const isParent = childDoc.parentUser.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'super_admin';

  if (!isParent && !isAdmin) {
    res.status(401); throw new Error('غير مصرح لك بعرض هذه السجلات');
  }

  let query = { child: childId };
  if (req.query.type) {
    query.logType = req.query.type;
  }

  const logs = await DailyLog.find(query).sort({ startTime: -1 });
  res.status(200).json(logs);
});

/**
 * @desc    تعديل سجل
 * @route   PUT /api/v1/logs/:logId
 * @access  Private (الأم فقط)
 */
const updateDailyLog = asyncHandler(async (req, res) => {
  const log = await DailyLog.findById(req.params.logId);

  if (!log) {
    res.status(404); throw new Error('السجل غير موجود');
  }

  // الأم بس اللي تعدل يومياتها
  if (log.parentUser.toString() !== req.user._id.toString()) {
    res.status(401); throw new Error('غير مصرح لك بالتعديل');
  }

  const updatedLog = await DailyLog.findByIdAndUpdate(
    req.params.logId,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedLog);
});

/**
 * @desc    حذف سجل
 * @route   DELETE /api/v1/logs/:logId
 * @access  Private (الأم والوزارة)
 */
const deleteDailyLog = asyncHandler(async (req, res) => {
  const log = await DailyLog.findById(req.params.logId);

  if (!log) {
    res.status(404); throw new Error('السجل غير موجود');
  }

  // الحماية: الأم أو الأدمن
  if (log.parentUser.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    res.status(401); throw new Error('غير مصرح لك بالحذف');
  }

  await log.deleteOne();
  res.status(200).json({ success: true, message: 'تم الحذف' });
});

module.exports = {
  addDailyLog,
  getChildDailyLogs,
  updateDailyLog,
  deleteDailyLog,
};