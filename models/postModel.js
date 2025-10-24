// models/postModel.js

const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
      required: [true, 'الرجاء إدخال محتوى البوست'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    // --- (الحقل الجديد للإعجابات) ---
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // كل عنصر في القائمة هو ID مستخدم
    }],
    // --------------------------------
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Post', postSchema);