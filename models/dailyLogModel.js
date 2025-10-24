// models/dailyLogModel.js

const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema(
  {
    // --- (1. الربط) ---
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Child',
    },

    // --- (2. نوع السجل) ---
    logType: {
      type: String,
      required: true,
      enum: ['feeding', 'diaper', 'sleep'], // رضاعة، حفاض، نوم
    },

    // --- (3. حقول مشتركة) ---
    startTime: {
      type: Date,
      required: true, // وقت البدء (أو وقت تغيير الحفاض)
    },
    notes: {
      type: String,
    },

    // --- (4. حقول خاصة بـ "الرضاعة") ---
    // (يمكن استخدامه كـ "مدة" أو "وقت الانتهاء")
    endTime: {
      type: Date, 
    },
    quantity: {
      type: Number, // (مثال: 120)
    },
    unit: {
      type: String, // (مثال: 'ml' أو 'oz')
    },
    
    // --- (5. حقول خاصة بـ "الحفاض") ---
    diaperType: {
      type: String,
      enum: ['wet', 'dirty', 'both'], // مبلل، متسخ، كلاهما
    },

    // (حقل "endTime" المشترك يمكن استخدامه لتسجيل "نهاية النوم")
  },
  {
    timestamps: true,
  }
);

// فهرس لزيادة سرعة جلب سجلات الطفل
dailyLogSchema.index({ child: 1, logType: 1, startTime: -1 });

module.exports = mongoose.model('DailyLog', dailyLogSchema);