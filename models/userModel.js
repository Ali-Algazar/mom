// models/userModel.js

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
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'الرجاء إدخال بريد إلكتروني صالح',
      ],
    },
    password: {
      type: String,
      // (مبقاش مطلوب إجباري)
      // required: [true, 'الرجاء إدخال كلمة المرور'], 
      minlength: 6,
      select: false, // (اختياري: عشان كلمة السر مترجعش في الردود)
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    fcmToken: {
      type: String,
      default: null,
    },
    // --- (الإضافات الجديدة) ---
    googleId: { // ID المستخدم من جوجل
      type: String,
      unique: true,
      sparse: true, // (بيسمح بوجود أكتر من null بس بيمنع تكرار الـ ID نفسه)
    },
    facebookId: { // ID المستخدم من فيسبوك
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: { // رابط صورة البروفايل
      type: String,
    }
    // -----------------------
  },
  {
    timestamps: true,
  }
);

// (ممكن نضيف كود هنا عشان يتأكد إن الباسورد موجود لو مفيش جوجل أو فيسبوك)

module.exports = mongoose.model('User', userSchema);