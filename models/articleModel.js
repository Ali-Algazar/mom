// models/articleModel.js

const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'الرجاء إدخال عنوان المقال'],
      unique: true,
    },
    content: {
      type: String,
      required: [true, 'الرجاء إدخال محتوى المقال'],
    },
    category: {
      type: String,
      required: [true, 'الرجاء تحديد تصنيف المقال'],
      enum: [
        'general-tips',   // نصائح عامة (مثل نمو الطفل)
        'vaccination-prep', // قبل التطعيم
        'post-vaccination', // بعد التطعيم
        'nutrition',        // التغذية والرضاعة
        'travel',           // السفر والحملات
        'medicines',        // (يمكن استخدامه لقاعدة بيانات الأدوية)
      ],
      default: 'general-tips',
    },
    // --- (Image URL field) ---
    imageUrl: {
      type: String, // This will store the URL of the uploaded image
    },
    // -------------------------
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Refers to the User model (the admin who wrote it)
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Article', articleSchema);