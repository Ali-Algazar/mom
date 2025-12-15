const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema(
  {
    // --- (1. الربط) ---
    // 🔥 تم التعديل إلى parentUser للتوافق 🔥
    parentUser: {
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
    
    // (رابط الصورة)
    imageUrl: {
      type: String,
    },

    // (تاريخ الذكرى)
    dateOfMemory: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // (معلم تطوري: أول كلمة، أول خطوة...)
    milestone: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// الفهرس
diaryEntrySchema.index({ child: 1, dateOfMemory: -1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);