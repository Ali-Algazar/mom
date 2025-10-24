// controllers/authController.js

const User = require('../models/userModel');
const Child = require('../models/childModel');
const ChildVaccination = require('../models/childVaccinationModel');
// --- (1. إضافة استيراد لبقية النماذج) ---
const GrowthRecord = require('../models/growthRecordModel');
const DailyLog = require('../models/dailyLogModel');
const DiaryEntry = require('../models/diaryEntryModel');

const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const asyncHandler = require('express-async-handler');

/**
 * @desc    تسجيل مستخدم جديد (إنشاء حساب)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('الرجاء إدخال جميع الحقول');
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('هذا البريد الإلكتروني مسجل مسبقاً');
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  if (user) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    });
  } else {
    res.status(400);
    throw new Error('بيانات المستخدم غير صالحة');
  }
});

/**
 * @desc    مصادقة المستخدم (تسجيل الدخول)
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('الرجاء إدخال الإيميل وكلمة المرور');
  }
  const user = await User.findOne({ email });
  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: token,
    });
  } else {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }
});

/**
 * @desc    جلب بيانات المستخدم الحالي
 * @route   GET /api/v1/auth/me
 * @access  Private (محمي)
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

/**
 * @desc    تعديل بيانات المستخدم (الاسم والإيميل)
 * @route   PUT /api/v1/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        res.status(400);
        throw new Error('هذا البريد الإلكتروني مستخدم مسبقاً');
      }
    }
    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('المستخدم غير موجود');
  }
});

/**
 * @desc    حذف حساب المستخدم (وجميع بياناته)
 * @route   DELETE /api/v1/auth/me
 * @access  Private
 */
const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // --- (2. تحديث شامل لحذف كل شيء) ---
  await ChildVaccination.deleteMany({ parent: userId });
  await GrowthRecord.deleteMany({ parent: userId });
  await DailyLog.deleteMany({ parent: userId });
  await DiaryEntry.deleteMany({ parent: userId });
  await Child.deleteMany({ parent: userId });
  
  // 3. حذف المستخدم نفسه
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: 'تم حذف حسابك وجميع البيانات المرتبطة به بنجاح',
  });
});

/**
 * @desc    تحديث (FCM Token) الخاص بالمستخدم
 * @route   PUT /api/v1/auth/fcmtoken
 * @access  Private
 */
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    res.status(400);
    throw new Error('لم يتم إرسال (fcmToken)');
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { fcmToken: fcmToken },
    { new: true } // <-- (3. هذا هو السطر الذي كان ناقصاً)
  ).select('name email fcmToken'); 

  res.status(200).json({
    message: 'تم تحديث عنوان الجهاز بنجاح',
    user: user,
  });
});


module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  deleteMe,
  updateFcmToken, 
};