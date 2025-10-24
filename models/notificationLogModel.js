// models/notificationLogModel.js

const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    // --- (لمن تم الإرسال) ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // --- (هل نجح؟) ---
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    // --- (رسالة الخطأ إن وجد) ---
    errorMessage: {
      type: String,
    },
    // --- (معلومات عن الإشعار نفسه - اختياري) ---
    notificationTitle: {
      type: String,
    },
    notificationBody: {
      type: String,
    },
  },
  {
    timestamps: true, // يسجل وقت حدوث العملية
  }
);

module.exports = mongoose.model('NotificationLog', notificationLogSchema);