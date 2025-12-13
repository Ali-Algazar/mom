// controllers/authController.js

const User = require('../models/userModel');
const Child = require('../models/childModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// دالة توليد التوكن
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    تسجيل أم جديدة (User)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId } = req.body;

  // التحقق من البيانات
  if (!name || !email || !password || !nationalId) {
    res.status(400);
    throw new Error('الرجاء إدخال الاسم، الإيميل، الرقم السري، والرقم القومي');
  }

  // التحقق من التكرار
  const userExists = await User.findOne({ $or: [{ email }, { nationalId }] });
  if (userExists) {
    res.status(400);
    throw new Error('البريد الإلكتروني أو الرقم القومي مسجل مسبقاً');
  }

  // تشفير كلمة المرور
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // إنشاء الأم
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    nationalId,
    role: 'user'
  });

  if (user) {
    // 🔥 الربط التلقائي 🔥
    // أي طفل مسجل بالرقم القومي للأم دي، نربطه بيها فوراً
    await Child.updateMany(
      { motherNationalId: nationalId }, 
      { parentUser: user._id }          
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      message: "تم إنشاء الحساب وربط الأطفال المسجلين بنجاح"
    });
  } else {
    res.status(400);
    throw new Error('بيانات غير صحيحة');
  }
});

/**
 * @desc    إنشاء حساب موظف جديد (Staff)
 * @route   POST /api/v1/admin/create-staff
 * @access  Private (Super Admin Only)
 */
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, workplace } = req.body;

  // التحقق من بيانات مكان العمل
  if (!workplace || !workplace.governorate || !workplace.city || !workplace.healthUnit) {
    res.status(400);
    throw new Error('يجب تحديد مكان عمل الموظف بدقة (المحافظة، المدينة، الوحدة)');
  }

  const staffExists = await User.findOne({ email });
  if (staffExists) {
    res.status(400);
    throw new Error('الموظف مسجل بالفعل');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const staff = await User.create({
    name,
    email,
    password: hashedPassword,
    nationalId,
    role: 'staff', // تحديد الدور كموظف
    workplace: workplace // تخزين مكان العمل
  });

  if (staff) {
    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      workplace: staff.workplace
    });
  } else {
    res.status(400);
    throw new Error('فشل إنشاء حساب الموظف');
  }
});

/**
 * @desc    تسجيل الدخول
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      workplace: user.workplace, // بنرجع مكان العمل لو موظف عشان الـ Frontend يحتاجه
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }
});

/**
 * @desc    جلب بياناتي
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(req.user);
});

// ... (الكود القديم فوق) ...

/**
 * @desc    إنشاء أول أدمن (مؤقت)
 * @route   POST /api/v1/auth/setup-admin
 * @access  Public
 */
const createFirstAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, secretKey } = req.body;

  // 1. حماية بسيطة: لازم تبعت المفتاح السري ده
  if (secretKey !== 'admin-setup-123') {
    res.status(403);
    throw new Error('مفتاح الأمان غير صحيح! لا تحاول الاختراق.');
  }

  // 2. التحقق من التكرار
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400); throw new Error('الأدمن موجود بالفعل');
  }

  // 3. إنشاء السوبر أدمن
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    nationalId, // حتى الأدمن محتاج رقم قومي عشان الداتابيز متزعلش
    role: 'super_admin' // 🔥 أهم حتة 🔥
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id),
      message: "تم إنشاء السوبر أدمن بنجاح! امسح الكود ده فوراً."
    });
  } else {
    res.status(400); throw new Error('فشل الإنشاء');
  }
});

// متنساش تضيف الدالة الجديدة هنا 👇
module.exports = {
  registerUser,
  createStaff,
  loginUser,
  getMe,
  createFirstAdmin, // <-- ضيفتها هنا
};
