// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // الحصول على التوكن من الـ Header
      token = req.headers.authorization.split(' ')[1];

      // فك تشفير التوكن
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // جلب بيانات المستخدم وتخزينها في req.user
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('غير مصرح، التوكن غير صالح');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('غير مصرح، لا يوجد توكن');
  }
});

// 🔥 الدالة الجديدة: تحديد الصلاحيات (Roles) 🔥
// بنبعتلها قائمة بالأدوار المسموح ليها (مثلاً: 'staff', 'super_admin')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error('غير مصرح، لم يتم تسجيل الدخول');
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403); // 403 Forbidden
      throw new Error(`غير مصرح: دورك (${req.user.role}) لا يملك صلاحية دخول هذا الرابط`);
    }
    next();
  };
};

module.exports = { protect, authorize };