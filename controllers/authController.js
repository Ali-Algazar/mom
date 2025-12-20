const User = require('../models/userModel');
const Child = require('../models/childModel');
const HealthUnit = require('../models/healthUnitModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- دالة مساعدة لتوليد التوكن ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- دالة مساعدة للرد ببيانات المستخدم مع التوكن ---
const respondWithToken = (res, user) => {
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    workplace: user.workplace,
    avatar: user.avatar,
    fcmToken: user.fcmToken,
    token: generateToken(user._id),
  });
};

// ---------------------------------------------------------------------
// 1. الوظائف الأساسية (Auth)
// ---------------------------------------------------------------------

// @desc    تسجيل مستخدم جديد
// @route   POST /api/v1/auth/register
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
    name, email, password: hashedPassword, nationalId, role: 'user'
  });

  if (user) {
    // ربط الأطفال بالأم تلقائياً عند التسجيل
    await Child.updateMany({ motherNationalId: nationalId }, { parentUser: user._id });
    respondWithToken(res, user);
  } else {
    res.status(400); throw new Error('بيانات غير صحيحة');
  }
});

// @desc    تسجيل الدخول
// @route   POST /api/v1/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, fcmToken } = req.body;

  if (!email || !password) {
    res.status(400); throw new Error('الرجاء إدخال البريد وكلمة المرور');
  }

  const user = await User.findOne({ email }).select('+password').populate('workplace');

  if (user && (await bcrypt.compare(password, user.password))) {
    if (fcmToken) {
      user.fcmToken = fcmToken;
      await user.save();
    }
    respondWithToken(res, user);
  } else {
    res.status(401); throw new Error('بيانات الدخول غير صحيحة');
  }
});

// @desc    تسجيل الدخول بجوجل
// @route   POST /api/v1/auth/google
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken, fcmToken } = req.body;
  if (!idToken) { res.status(400); throw new Error('Google ID Token مطلوب'); }

  const ticket = await client.verifyIdToken({
      idToken: idToken, audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { name, email, picture, sub: googleId } = ticket.getPayload();

  let user = await User.findOne({ email });

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
    }
    if (fcmToken) user.fcmToken = fcmToken;
    await user.save();
    respondWithToken(res, user);
  } else {
    const randomNationalId = "TEMP" + Date.now(); 
    const newUser = await User.create({
      googleId, name, email, avatar: picture, nationalId: randomNationalId, role: 'user', fcmToken
    });
    respondWithToken(res, newUser);
  }
});

// @desc    تسجيل الدخول بفيسبوك
// @route   POST /api/v1/auth/facebook
const facebookLogin = asyncHandler(async (req, res) => {
    const { accessToken, fcmToken } = req.body;
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
        }
        if (fcmToken) user.fcmToken = fcmToken;
        await user.save();
        respondWithToken(res, user);
    } else {
        const randomNationalId = "TEMP" + Date.now();
        const newUser = await User.create({
            facebookId, name, email, avatar: picture.data.url, nationalId: randomNationalId, role: 'user', fcmToken
        });
        respondWithToken(res, newUser);
    }
});

// ---------------------------------------------------------------------
// 2. وظائف الإدارة (Admin/Staff Setup)
// ---------------------------------------------------------------------

// @desc    إنشاء حساب موظف
// @route   POST /api/v1/auth/admin/create-staff
const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, healthUnitId } = req.body;

  if (!healthUnitId) { res.status(400); throw new Error('يجب اختيار الوحدة الصحية'); }

  const unitExists = await HealthUnit.findById(healthUnitId);
  if (!unitExists) { res.status(404); throw new Error('الوحدة الصحية غير موجودة'); }

  const staffExists = await User.findOne({ email });
  if (staffExists) { res.status(400); throw new Error('الموظف مسجل بالفعل'); }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const staff = await User.create({
    name, email, password: hashedPassword, nationalId, role: 'staff', workplace: healthUnitId
  });

  if (staff) {
    res.status(201).json({
      _id: staff._id, name: staff.name, role: staff.role, workplace: unitExists
    });
  } else {
    res.status(400); throw new Error('فشل إنشاء حساب الموظف');
  }
});

// @desc    إنشاء أول أدمن
// @route   POST /api/v1/auth/setup-admin
const createFirstAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, nationalId, secretKey } = req.body;
  if (secretKey !== 'admin-setup-123') { res.status(403); throw new Error('مفتاح الأمان غير صحيح'); }

  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error('الأدمن موجود بالفعل'); }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const admin = await User.create({
    name, email, password: hashedPassword, nationalId, role: 'super_admin'
  });

  if (admin) {
    res.status(201).json({
      _id: admin._id, name: admin.name, role: admin.role,
      token: generateToken(admin._id)
    });
  } else {
    res.status(400); throw new Error('فشل الإنشاء');
  }
});

// ---------------------------------------------------------------------
// 3. إدارة الملف الشخصي (User Profile) - عرض، تعديل، حذف
// ---------------------------------------------------------------------

// @desc    جلب بياناتي
// @route   GET /api/v1/auth/me
const getMe = asyncHandler(async (req, res) => { res.status(200).json(req.user); });

// @desc    تحديث FCM Token
// @route   PUT /api/v1/auth/fcm-token
const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) { res.status(400); throw new Error('FCM Token مطلوب'); }
  
  const user = await User.findByIdAndUpdate(req.user._id, { fcmToken }, { new: true });
  res.status(200).json({ success: true, fcmToken: user.fcmToken });
});

// @desc    تحديث بيانات الحساب (الاسم، الباسورد، الصورة)
// @route   PUT /api/v1/auth/profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.avatar = req.body.avatar || user.avatar;

    // تحديث الباسورد لو اتبعتت
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    // إرجاع التوكن الجديد (احتياطي) مع البيانات
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404); throw new Error('المستخدم غير موجود');
  }
});

// @desc    حذف حسابي (بواسطة المستخدم نفسه)
// @route   DELETE /api/v1/auth/profile
const deleteMyAccount = asyncHandler(async (req, res) => {
  // يمكن هنا حذف البيانات المرتبطة لو حابب (مثل البوستات)، بس الحذف المباشر أسهل كبداية
  await User.findByIdAndDelete(req.user._id);
  res.status(200).json({ success: true, message: 'تم حذف الحساب بنجاح' });
});

// ---------------------------------------------------------------------
// 4. حذف المستخدمين (Admin Only)
// ---------------------------------------------------------------------

// @desc    حذف مستخدم معين بواسطة الأدمن
// @route   DELETE /api/v1/users/:id
const deleteUserByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.status(200).json({ success: true, message: 'تم حذف المستخدم بواسطة الإدارة' });
  } else {
    res.status(404); throw new Error('المستخدم غير موجود');
  }
});

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  facebookLogin,
  createStaff,
  createFirstAdmin,
  getMe,
  updateFcmToken,
  updateUserProfile, // ✅ تعديل
  deleteMyAccount,   // ✅ حذف الحساب بنفسي
  deleteUserByAdmin, // ✅ حذف بواسطة الأدمن
};