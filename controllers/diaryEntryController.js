const asyncHandler = require('express-async-handler');
const DiaryEntry = require('../models/diaryEntryModel');
const Child = require('../models/childModel');

/**
 * @desc    إضافة ذكرى (يومية) جديدة
 * @route   POST /api/v1/diary
 * @access  Private (الأم فقط)
 */
const addDiaryEntry = asyncHandler(async (req, res) => {
  const { child, title, notes, imageUrl, dateOfMemory, milestone } = req.body;

  if (!child || !title || !notes) {
    res.status(400); throw new Error('الرجاء إدخال بيانات الطفل، العنوان، والملاحظات');
  }

  const childDoc = await Child.findById(child);
  if (!childDoc) {
    res.status(404); throw new Error('لم يتم العثور على الطفل');
  }

  // التحقق: الأم فقط هي من تضيف اليوميات
  if (childDoc.parentUser.toString() !== req.user._id.toString()) {
    res.status(401); throw new Error('غير مصرح لك بإضافة يوميات لهذا الطفل');
  }

  const entry = await DiaryEntry.create({
    parentUser: req.user._id, // 🔥 حفظنا parentUser
    child,
    title,
    notes,
    imageUrl,
    dateOfMemory,
    milestone,
  });

  res.status(201).json(entry);
});

/**
 * @desc    جلب يوميات طفل
 * @route   GET /api/v1/diary/child/:childId
 * @access  Private (الأم والوزارة)
 */
const getChildDiaryEntries = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  const childDoc = await Child.findById(childId);
  if (!childDoc) {
    res.status(404); throw new Error('لم يتم العثور على الطفل');
  }

  // الحماية: الأم أو الأدمن
  const isParent = childDoc.parentUser.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'super_admin';

  if (!isParent && !isAdmin) {
    res.status(401); throw new Error('غير مصرح لك بعرض هذه اليوميات');
  }

  const entries = await DiaryEntry.find({ child: childId }).sort({
    dateOfMemory: -1,
  });

  res.status(200).json(entries);
});

/**
 * @desc    تعديل يومية
 * @route   PUT /api/v1/diary/:entryId
 * @access  Private (الأم فقط)
 */
const updateDiaryEntry = asyncHandler(async (req, res) => {
  const entry = await DiaryEntry.findById(req.params.entryId);

  if (!entry) {
    res.status(404); throw new Error('السجل غير موجود');
  }

  // الأم فقط من تعدل ذكرياتها
  if (entry.parentUser.toString() !== req.user._id.toString()) {
    res.status(401); throw new Error('غير مصرح لك بتعديل هذا السجل');
  }

  const updatedEntry = await DiaryEntry.findByIdAndUpdate(
    req.params.entryId,
    req.body,
    { new: true, runValidators: true }
  );

  res.status(200).json(updatedEntry);
});

/**
 * @desc    حذف يومية
 * @route   DELETE /api/v1/diary/:entryId
 * @access  Private (الأم والوزارة)
 */
const deleteDiaryEntry = asyncHandler(async (req, res) => {
  const entry = await DiaryEntry.findById(req.params.entryId);

  if (!entry) {
    res.status(404); throw new Error('السجل غير موجود');
  }

  // الحماية: الأم أو الأدمن (لحذف محتوى غير لائق مثلاً)
  if (entry.parentUser.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
    res.status(401); throw new Error('غير مصرح لك بحذف هذا السجل');
  }

  await entry.deleteOne();
  res.status(200).json({ success: true, message: 'تم الحذف' });
});

module.exports = {
  addDiaryEntry,
  getChildDiaryEntries,
  updateDiaryEntry,
  deleteDiaryEntry,
};