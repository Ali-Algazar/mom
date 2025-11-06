// controllers/authController.js

const User = require('../models/userModel');
const Child = require('../models/childModel');
const ChildVaccination = require('../models/childVaccinationModel');
const GrowthRecord = require('../models/growthRecordModel');
const DailyLog = require('../models/dailyLogModel');
const DiaryEntry = require('../models/diaryEntryModel');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const asyncHandler = require('express-async-handler');
// --- (1. استيراد المكتبات الجديدة) ---
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// ----------------------------------

// --- (2. وظيفة مساعدة لإصدار التوكن بتاعنا) ---
const generateTokenAndRespond = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar, // (رجعنا الصورة كمان)
    token: token,
  });
};
// ----------------------------------

/**
 * @desc    تسجيل مستخدم جديد
 * @route   POST /api/v1/auth/register
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400); throw new Error('الرجاء إدخال جميع الحقول');
  }
  if (password.length < 6) {
     res.status(400); throw new Error('كلمة المرور يجب أن تكون 6 حروف على الأقل');
  }
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400); throw new Error('هذا البريد الإلكتروني مسجل مسبقاً');
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (user) {
    generateTokenAndRespond(res, user); // (استخدام الوظيفة المساعدة)
  } else {
    res.status(400); throw new Error('بيانات المستخدم غير صالحة');
  }
});

/**
 * @desc    تسجيل الدخول
 * @route   POST /api/v1/auth/login
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400); throw new Error('الرجاء إدخال الإيميل وكلمة المرور');
  }
  // (لازم نطلب الباسورد عشان نقارنه)
  const user = await User.findOne({ email }).select('+password'); 
  if (user && (await bcrypt.compare(password, user.password))) {
    generateTokenAndRespond(res, user); // (استخدام الوظيفة المساعدة)
  } else {
    res.status(401); throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }
});

// --- (3. الوظيفة الجديدة لتسجيل الدخول بجوجل) ---
/**
 * @desc    التسجيل بجوجل
 * @route   POST /api/v1/auth/google
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body; // Flutter هيبعت الـ idToken

  if (!idToken) {
    res.status(400);
    throw new Error('لم يتم إرسال Google ID Token');
  }

  // 1. التحقق من التوكن من جوجل
  const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email, picture, sub: googleId } = ticket.getPayload();

  // 2. البحث عن المستخدم في قاعدة بياناتنا بالإيميل
  let user = await User.findOne({ email: email });

  if (user) {
    // المستخدم موجود (سجل قبل كده بالإيميل أو بجوجل)
    if (!user.googleId) {
      // لو سجل بالإيميل قبل كده، اربط حسابه بجوجل
      user.googleId = googleId;
      user.avatar = user.avatar || picture; // حدث الصورة لو مكنش عنده
      await user.save();
    }
    // 3. إصدار التوكن بتاعنا
    generateTokenAndRespond(res, user);
  } else {
    // المستخدم ده جديد، اعمل له حساب
    const newUser = await User.create({
      googleId: googleId,
      name: name,
      email: email,
      avatar: picture,
      // (مفيش باسورد)
    });
    // 3. إصدار التوكن بتاعنا
    generateTokenAndRespond(res, newUser);
  }
});

// --- (4. الوظيفة الجديدة لتسجيل الدخول بفيسبوك) ---
/**
 * @desc    التسجيل بفيسبوك
 * @route   POST /api/v1/auth/facebook
 */
const facebookLogin = asyncHandler(async (req, res) => {
    const { accessToken } = req.body; // Flutter هيبعت الـ accessToken

    if (!accessToken) {
        res.status(400);
        throw new Error('لم يتم إرسال Facebook Access Token');
    }

    // 1. التحقق من التوكن من فيسبوك
    const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
    const { data } = await axios.get(url);
    const { id: facebookId, name, email, picture } = data;

    if (!email) {
        // (مهم: أحيانًا فيسبوك مش بيرجع الإيميل لو المستخدم رفض)
        res.status(400);
        throw new Error('لم نتمكن من الحصول على الإيميل من فيسبوك. يرجى المحاولة بجوجل أو التسجيل اليدوي.');
    }

    // 2. البحث عن المستخدم في قاعدة بياناتنا بالإيميل
    let user = await User.findOne({ email: email });

    if (user) {
        // المستخدم موجود
        if (!user.facebookId) {
            user.facebookId = facebookId;
            user.avatar = user.avatar || picture.data.url;
            await user.save();
        }
        generateTokenAndRespond(res, user);
    } else {
        // المستخدم جديد
        const newUser = await User.create({
            facebookId: facebookId,
            name: name,
            email: email,
            avatar: picture.data.url,
            // (مفيش باسورد)
        });
        generateTokenAndRespond(res, newUser);
    }
});


// ... (باقي الوظائف: getMe, updateMe, deleteMe, updateFcmToken) ...
const getMe = asyncHandler(async (req, res) => { /* ... code ... */ });
const updateMe = asyncHandler(async (req, res) => { /* ... code ... */ });
const deleteMe = asyncHandler(async (req, res) => { /* ... code ... */ });
const updateFcmToken = asyncHandler(async (req, res) => { /* ... code ... */ });

// 5. تحديث الـ Exports
module.exports = {
  registerUser,
  loginUser,
  googleLogin, // <-- إضافة
  facebookLogin, // <-- إضافة
  getMe,
  updateMe,
  deleteMe,
  updateFcmToken,
};