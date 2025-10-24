// models/growthRecordModel.js

const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema(
  {
    // --- (1. الربط بالأم) ---
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // يشير إلى الأم
    },
    // --- (2. الربط بالطفل) ---
    child: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Child', // يشير إلى الطفل
    },

    // --- (3. بيانات القياس) ---
    weight: {
      type: Number, // الوزن (مثلاً بالكيلوجرام)
      required: [true, 'الرجاء إدخال وزن الطفل'],
    },
    height: {
      type: Number, // الطول (مثلاً بالسنتيمتر)
      required: [true, 'الرجاء إدخال طول الطفل'],
    },
    // (محيط الرأس - اختياري ولكنه مهم في تتبع النمو)
    headCircumference: {
      type: Number, 
    },

    // (تاريخ القياس)
    dateOfMeasurement: {
      type: Date,
      required: [true, 'الرجاء إدخال تاريخ القياس'],
      default: Date.now, // التاريخ الافتراضي هو "الآن"
    },

    // (ملاحظات اختيارية)
    notes: {
      type: String,
    },
  },
  {
    timestamps: true, // لإضافة createdAt و updatedAt
  }
);

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);