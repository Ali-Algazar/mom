// middleware/errorMiddleware.js

// Middleware للتعامل مع "المسارات غير الموجودة" (404)
const notFound = (req, res, next) => {
  const error = new Error(`المسار غير موجود - ${req.originalUrl}`);
  res.status(404);
  next(error); // تمرير الخطأ إلى معالج الأخطاء التالي
};

// Middleware "عام" للتعامل مع كل الأخطاء
// (لاحظ أنه يأخذ 4 معاملات: err, req, res, next)
const errorHandler = (err, req, res, next) => {
  // أحياناً يصل الخطأ بدون كود حالة، فنجعله 500 (خطأ عام في السيرفر)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // (يمكن إضافة معالجة خاصة لأخطاء Mongoose هنا لاحقاً)

  // إرسال الرد بصيغة JSON بدلاً من HTML
  res.status(statusCode).json({
    success: false,
    message: message,
    // سنقوم بإظهار "stack trace" فقط إذا كنا في وضع التطوير
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };