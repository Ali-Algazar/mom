const User = require('../models/userModel');
const Child = require('../models/childModel');
const HealthUnit = require('../models/healthUnitModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- دالة مساعدة لتوليد التوكن والرد ---
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
    avatar: user.avatar,
    token: token,
  });
};

// --- 1. تسجيل مستخدم جديد (للأمهات) ---
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId } = req.body;

  if (!name || !email || !password || !nationalId) {
    res.status(400); throw new Error('الرجاء إدخال جميع البيانات بما فيها الرقم القومي');
  }

  const userExists = await User.findOne({ $or: [{ email }, { nationalId }] });
  if (userExists) {
    res.status(400); throw new Error('البريد الإلكتروني أو الرقم القومي مسجل مسبقاً');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    nationalId,
    role: 'user'
  });

  if (user) {
    // الربط التلقائي بالأطفال
    await Child.updateMany(
      { motherNationalId: nationalId },
      { parentUser: user._id }
    );
    generateTokenAndRespond(res, user);
  } else {
    res.status(400); throw new Error('بيانات غير صحيحة');
  }
});

// --- 2. تسجيل الدخول ---
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400); throw new Error('الرجاء إدخال البريد وكلمة المرور');
  }

  // بنعمل populate عشان لو موظف، بيانات الوحدة (الاسم والمحافظة) تيجي معاه في الرد
  const user = await User.findOne({ email })
    .select('+password')
    .populate('workplace');

  if (user && (await bcrypt.compare(password, user.password))) {
    generateTokenAndRespond(res, user);
  } else {
    res.status(401); throw new Error('بيانات الدخول غير صحيحة');
  }
});

// --- 3. تسجيل الدخول بجوجل ---
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) { res.status(400); throw new Error('Google ID Token مطلوب'); }

  const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email, picture, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }
    generateTokenAndRespond(res, user);
  } else {
    // مستخدم جديد بجوجل (رقم قومي مؤقت)
    const randomNationalId = "TEMP" + Date.now(); 
    const newUser = await User.create({
      googleId, name, email, avatar: picture,
      nationalId: randomNationalId,
      role: 'user'
    });
    generateTokenAndRespond(res, newUser);
  }
});

// --- 4. تسجيل الدخول بفيسبوك ---
const facebookLogin = asyncHandler(async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) { res.status(400); throw new Error('Facebook Access Token مطلوب'); }

    const url = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
    const { data } = await axios.get(url);
    const { id: facebookId, name, email, picture } = data;

    if (!email) { res.status(400); throw new Error('لم نتمكن من جلب الإيميل من فيسبوك'); }

    let user = await User.findOne({ email });

    if (user) {
        if (!user.facebookId) {
            user.facebookId = facebookId;
            user.avatar = user.avatar || picture.data.url;
            await user.save();
        }
        generateTokenAndRespond(res, user);
    } else {
        const randomNationalId = "TEMP" + Date.now();
        const newUser = await User.create({
            facebookId, name, email, avatar: picture.data.url,
            nationalId: randomNationalId,
            role: 'user'
        });
        generateTokenAndRespond(res, newUser);
    }
});

// --- 5. إنشاء حساب موظف (مربوط بوحدة صحية) ---
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, healthUnitId } = req.body;

  if (!healthUnitId) {
    res.status(400); throw new Error('يجب اختيار الوحدة الصحية (healthUnitId)');
  }

  // التأكد من أن الوحدة موجودة
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
    workplace: healthUnitId // تخزين الـ ID فقط
  });

  if (staff) {
    res.status(201).json({
      _id: staff._id,
      name: staff.name,
      role: staff.role,
      workplace: unitExists // إرجاع بيانات الوحدة للتأكيد
    });
  } else {
    res.status(400); throw new Error('فشل إنشاء حساب الموظف');
  }
});

// --- 6. إنشاء أول أدمن (مؤقت) ---
const createFirstAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, secretKey } = req.body;

  if (secretKey !== 'admin-setup-123') {
    res.status(403); throw new Error('مفتاح الأمان غير صحيح');
  }

  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error('الأدمن موجود بالفعل'); }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = await User.create({
    name, email, password: hashedPassword, nationalId,
    role: 'super_admin'
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id, name: admin.name, email: admin.email, role: admin.role,
      token: jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
    });
  } else {
    res.status(400); throw new Error('فشل الإنشاء');
  }
});

// --- دوال أخرى ---
const getMe = asyncHandler(async (req, res) => { res.status(200).json(req.user); });
const updateMe = asyncHandler(async (req, res) => { res.status(200).json({ msg: "Update logic" }); });
const deleteMe = asyncHandler(async (req, res) => { res.status(200).json({ msg: "Delete logic" }); });
const updateFcmToken = asyncHandler(async (req, res) => { res.status(200).json({ msg: "FCM logic" }); });

// 🔥 التصدير الكامل (مهم جداً عشان الراوت يشوف الدوال) 🔥
module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  createStaff,
  createFirstAdmin,
  getMe,
  updateMe,
  deleteMe,
  updateFcmToken
};