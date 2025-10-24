// controllers/diaryEntryController.js

const asyncHandler = require('express-async-handler');
const DiaryEntry = require('../models/diaryEntryModel');
const Child = require('../models/childModel'); // نحتاجه للتحقق من الملكية

/**
 * @desc    إضافة ذكرى (يومية) جديدة
 * @route   POST /api/v1/diary
 * @access  Private
 */
const addDiaryEntry = asyncHandler(async (req, res) => {
  const { child, title, notes, imageUrl, dateOfMemory, milestone } = req.body;

  // التحقق من المدخلات الأساسية
  if (!child || !title || !notes) {
    res.status(400);
    throw new Error('الرجاء إدخال بيانات الطفل، العنوان، والملاحظات');
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
    throw new Error('غير مصرح لك بإضافة يوميات لهذا الطفل');
  }

  // إنشاء السجل
  const entry = await DiaryEntry.create({
    parent: req.user.id, // الربط بالأم
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
 * @desc    جلب كل يوميات طفل معين
 * @route   GET /api/v1/diary/child/:childId
 * @access  Private
 */
const getChildDiaryEntries = asyncHandler(async (req, res) => {
  const { childId } = req.params;

  // --- (خطوة أمنية) ---
  const childDoc = await Child.findById(childId);
  if (!childDoc) {
    res.status(404);
    throw new Error('لم يتم العثور على الطفل');
  }
  if (childDoc.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بعرض هذه اليوميات');
  }

  // جلب السجلات مرتبة بالتاريخ (الأحدث أولاً)
  const entries = await DiaryEntry.find({ child: childId }).sort({
    dateOfMemory: 'desc',
  });

  res.status(200).json(entries);
});

/**
 * @desc    تعديل يومية
 * @route   PUT /api/v1/diary/:entryId
 * @access  Private
 */
const updateDiaryEntry = asyncHandler(async (req, res) => {
  const { entryId } = req.params;

  const entry = await DiaryEntry.findById(entryId);

  if (!entry) {
    res.status(404);
    throw new Error('لم يتم العثور على هذا السجل');
  }

  // --- (خطوة أمنية) ---
  // التأكد من أن السجل يخص المستخدم
  if (entry.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بتعديل هذا السجل');
  }

  const updatedEntry = await DiaryEntry.findByIdAndUpdate(
    entryId,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedEntry);
});

/**
 * @desc    حذف يومية
 * @route   DELETE /api/v1/diary/:entryId
 * @access  Private
 */
const deleteDiaryEntry = asyncHandler(async (req, res) => {
  const { entryId } = req.params;

  const entry = await DiaryEntry.findById(entryId);

  if (!entry) {
    res.status(404);
    throw new Error('لم يتم العثور على هذا السجل');
  }

  // --- (خطوة أمنية) ---
  if (entry.parent.toString() !== req.user.id) {
    res.status(401);
    throw new Error('غير مصرح لك بحذف هذا السجل');
  }

  await DiaryEntry.findByIdAndDelete(entryId);

  res.status(200).json({ success: true, message: 'تم حذف السجل بنجاح' });
});

module.exports = {
  addDiaryEntry,
  getChildDiaryEntries,
  updateDiaryEntry,
  deleteDiaryEntry,
};