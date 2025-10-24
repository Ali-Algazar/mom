// models/commentModel.js

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: { // محتوى الكومنت (الرد)
      type: String,
      required: [true, 'الرجاء إدخال محتوى الكومنت'],
    },
    // (مين اللي كتب الكومنت)
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // مربوط بنموذج المستخدم
    },
    // (الكومنت ده تبع أنهي بوست)
    post: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Post', // مربوط بنموذج البوست
    },
  },
  {
    timestamps: true, // وقت إنشاء الكومنت
  }
);

module.exports = mongoose.model('Comment', commentSchema);