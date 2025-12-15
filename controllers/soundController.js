const asyncHandler = require('express-async-handler');
const Sound = require('../models/soundModel');

/**
 * @desc    إنشاء صوت جديد (للأدمن)
 * @route   POST /api/v1/sounds
 * @access  Private/SuperAdmin
 */
const createSound = asyncHandler(async (req, res) => {
  const { title, description, category, audioUrl, imageUrl } = req.body;

  // التحقق من الحقول الأساسية
  if (!title || !audioUrl) {
    res.status(400); throw new Error('الرجاء إدخال العنوان ورابط ملف الصوت');
  }

  const sound = await Sound.create({
    title,
    description,
    category,
    audioUrl,
    imageUrl,
    addedBy: req.user._id, // الربط بالأدمن
  });

  res.status(201).json(sound);
});

/**
 * @desc    جلب جميع الأصوات (مع فلترة)
 * @route   GET /api/v1/sounds
 * @access  Public
 */
const getAllSounds = asyncHandler(async (req, res) => {
  let query = {};

  // الفلترة بالتصنيف
  if (req.query.category) {
    query.category = req.query.category;
  }

  const sounds = await Sound.find(query)
    .populate('addedBy', 'name')
    .sort({ title: 1 }); // ترتيب أبجدي

  res.status(200).json(sounds);
});

/**
 * @desc    جلب صوت واحد
 * @route   GET /api/v1/sounds/:id
 * @access  Public
 */
const getSoundById = asyncHandler(async (req, res) => {
  const sound = await Sound.findById(req.params.id).populate('addedBy', 'name');

  if (sound) {
    res.status(200).json(sound);
  } else {
    res.status(404); throw new Error('لم يتم العثور على الصوت');
  }
});

/**
 * @desc    تعديل صوت
 * @route   PUT /api/v1/sounds/:id
 * @access  Private/SuperAdmin
 */
const updateSound = asyncHandler(async (req, res) => {
  const sound = await Sound.findById(req.params.id);

  if (!sound) {
    res.status(404); throw new Error('لم يتم العثور على الصوت');
  }

  const updatedSound = await Sound.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json(updatedSound);
});

/**
 * @desc    حذف صوت
 * @route   DELETE /api/v1/sounds/:id
 * @access  Private/SuperAdmin
 */
const deleteSound = asyncHandler(async (req, res) => {
  const sound = await Sound.findById(req.params.id);

  if (!sound) {
    res.status(404); throw new Error('لم يتم العثور على الصوت');
  }

  await Sound.findByIdAndDelete(req.params.id);

  res.status(200).json({ success: true, message: 'تم حذف الصوت بنجاح' });
});

module.exports = {
  createSound,
  getAllSounds,
  getSoundById,
  updateSound,
  deleteSound,
};