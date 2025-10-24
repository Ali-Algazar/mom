// models/userModel.js

const mongoose = require('mongoose');

// 1. تعريف "شكل" بيانات المستخدم
const userSchema = new mongoose.Schema(
  {
    // --- بيانات أساسية ---
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
      required: [true, 'الرجاء إدخال كلمة المرور'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user', 
    },
    
    // --- (2. هذا هو الحقل الجديد للإشعارات) ---
    fcmToken: {
      type: String,
      default: null, // "عنوان" هاتف المستخدم من Firebase
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);