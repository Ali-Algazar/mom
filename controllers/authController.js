const User = require('../models/userModel');
const Child = require('../models/childModel');
const HealthUnit = require('../models/healthUnitModel'); // <-- استيراد موديل الوحدات
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// دالة مساعدة
const generateTokenAndRespond = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    workplace: user.workplace, // هيرجع الكائن كامل لو عملنا populate
    token: token,
  });
};

// ... (registerUser زي ما هي) ...
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId } = req.body;
  if (!name || !email || !password || !nationalId) {
    res.status(400); throw new Error('البيانات ناقصة');
  }
  const userExists = await User.findOne({ $or: [{ email }, { nationalId }] });
  if (userExists) { res.status(400); throw new Error('مستخدم موجود بالفعل'); }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name, email, password: hashedPassword, nationalId, role: 'user'
  });

  if (user) {
    await Child.updateMany({ motherNationalId: nationalId }, { parentUser: user._id });
    generateTokenAndRespond(res, user);
  } else {
    res.status(400); throw new Error('بيانات غير صحيحة');
  }
});

// ... (loginUser تعديل مهم) ...
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // هنا بنعمل populate عشان لو موظف، بيانات الوحدة (الاسم والمحافظة) تيجي معاه
  const user = await User.findOne({ email })
    .select('+password')
    .populate('workplace'); 

  if (user && (await bcrypt.compare(password, user.password))) {
    generateTokenAndRespond(res, user);
  } else {
    res.status(401); throw new Error('بيانات الدخول خطأ');
  }
});

// ... (googleLogin, facebookLogin زي ما هما) ...
// (اختصاراً للكود هنا، انسخهم من الملف القديم)

// 🔥 تعديل إنشاء الموظف لاستخدام ID الوحدة 🔥
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, healthUnitId } = req.body;

  // التحقق من وجود ID الوحدة
  if (!healthUnitId) {
    res.status(400); throw new Error('يجب اختيار الوحدة الصحية');
  }

  // التأكد من أن الوحدة موجودة فعلاً في الداتابيز
  const unitExists = await HealthUnit.findById(healthUnitId);
  if (!unitExists) {
    res.status(404); throw new Error('الوحدة الصحية المختارة غير موجودة');
  }

  const staffExists = await User.findOne({ email });
  if (staffExists) { res.status(400); throw new Error('الموظف مسجل بالفعل'); }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const staff = await User.create({
    name,
    email,
    password: hashedPassword,
    nationalId,
    role: 'staff',
    workplace: healthUnitId // بنخزن الـ ID بس
  });

  if (staff) {
    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      role: staff.role,
      workplace: unitExists // نرجع بيانات الوحدة عشان التأكيد
    });
  } else {
    res.status(400); throw new Error('فشل إنشاء الحساب');
  }
});

// ... (createFirstAdmin و getMe وباقي الدوال زي ما هما) ...
// (لكن في createFirstAdmin شيل workplace لأنه مش محتاجه)

// انسخ باقي الدوال القديمة هنا...

module.exports = {
  registerUser,
  loginUser,
  // ... باقي الدوال
  createStaff,
  // createFirstAdmin...
};