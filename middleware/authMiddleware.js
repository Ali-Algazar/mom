// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

// هذا هو "الحارس" الخاص بنا
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. التحقق مما إذا كان "Token" موجوداً في "Headers" الطلب
  // (عادة الـ Token يُرسل في هيدر اسمه "Authorization" ويبدأ بكلمة "Bearer")
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. استخلاص الـ Token من الهيدر (فصل كلمة "Bearer" عنه)
      token = req.headers.authorization.split(' ')[1];

      // 3. التحقق من صحة الـ Token وفك تشفيره
      // (سيقوم باستخراج الـ "id" الذي خزنّاه بداخله عند إنشائه)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. جلب بيانات المستخدم من قاعدة البيانات باستخدام الـ "id"
      // (نحن "لا" نريد جلب كلمة السر، لذلك نستخدم "select('-password')")
      req.user = await User.findById(decoded.id).select('-password');

      // 5. إذا تم كل شيء بنجاح، اسمح للطلب بالمرور للخطوة التالية
      next();
    } catch (error) {
      console.error(error);
      res.status(401); // 401 = Unauthorized
      throw new Error('غير مصرح لك، التوكن فشل');
    }
  }

  // 6. إذا لم يكن هناك "Token" أصلاً
  if (!token) {
    res.status(401);
    throw new Error('غير مصرح لك، لا يوجد توكن');
  }
});
// "حارس" للتحقق من أن المستخدم هو "Admin"
const admin = (req, res, next) => {
  // يفترض أن هذا الحارس "admin" يُستخدم "بعد" الحارس "protect"
  // لذلك، "req.user" يجب أن يكون موجوداً
  if (req.user && req.user.role === 'admin') {
    next(); // المستخدم هو "admin"، اسمح له بالمرور
  } else {
    res.status(401); // 401 = Unauthorized
    throw new Error('غير مصرح لك، هذه الوظيفة للمدير فقط');
  }
};


// 3. قم بتحديث "module.exports"
module.exports = { protect, admin };