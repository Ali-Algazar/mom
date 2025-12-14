const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال الاسم'],
    },
    email: {
      type: String,
      required: [true, 'الرجاء إدخال البريد الإلكتروني'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'الرجاء إدخال كلمة المرور'],
      minlength: 6,
      select: false,
    },
    nationalId: {
      type: String,
      required: [true, 'الرجاء إدخال الرقم القومي'],
      unique: true,
      length: 14,
    },
    role: {
      type: String,
      enum: ['user', 'staff', 'super_admin'],
      default: 'user',
    },
    // 🔥 التعديل هنا: الربط بجدول الوحدات الصحية 🔥
    workplace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthUnit', // الإشارة للموديل الجديد
      // هذا الحقل مطلوب فقط لو المستخدم "موظف"
    },
    fcmToken: { type: String, default: null },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    avatar: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);