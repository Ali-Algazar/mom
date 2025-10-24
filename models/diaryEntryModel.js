// models/diaryEntryModel.js

const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema(
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

    // --- (2. محتوى اليوميات) ---
    title: {
      type: String,
      required: [true, 'الرجاء إدخال عنوان للذكرى'],
    },
    notes: {
      type: String,
      required: [true, 'الرجاء إدخال وصف الذكرى'],
    },
    
    // (رابط الصورة التي سترفعها الأم)
    imageUrl: {
      type: String,
    },

    // (تاريخ الذكرى - قد يختلف عن تاريخ الإنشاء)
    dateOfMemory: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // (يمكن إضافة "معلم تطوري" هنا، مثل "أول خطوة")
    milestone: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// فهرس لزيادة سرعة جلب يوميات الطفل
diaryEntrySchema.index({ child: 1, dateOfMemory: -1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);