const mongoose = require('mongoose');

const soundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'الرجاء إدخال عنوان الصوت'],
      unique: true,
    },
    description: { // وصف بسيط
      type: String,
    },
    category: { // التصنيف
      type: String,
      enum: ['colic', 'sleep', 'calm', 'nature', 'white-noise'],
      default: 'calm',
    },
    // (رابط ملف الصوت نفسه)
    audioUrl: {
      type: String,
      required: [true, 'الرجاء إدخال رابط ملف الصوت'],
    },
    // (رابط صورة مصغرة)
    imageUrl: {
      type: String,
    },
    // (رابط الصوت بالأدمن)
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Sound', soundSchema);