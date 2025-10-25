// models/medicineModel.js

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال اسم الدواء'],
      unique: true,
    },
    image: {
      type: String,
      required: [true, 'الرجاء إدخال رابط صورة الدواء'],
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'الرجاء إدخال وصف الدواء'],
    },
    // (التصنيف)
    category: {
      type: String,
      required: [true, 'الرجاء تحديد تصنيف الدواء'],
      enum: [
        'fever',        // خافض حرارة
        'vitamins',     // فيتامينات
        'colic',        // مغص
        'pain-relief',  // مسكن ألم
        'other',        // أخرى
      ],
      default: 'other',
    },
    // (طريقة الاستخدام والجرعة)
    usage: {
      type: String,
      required: [true, 'الرجاء إدخال طريقة الاستخدام'],
    },
    // (الأعراض الجانبية والتنبيهات)
    sideEffects: {
      type: String,
    },
    // (رابط المقال بالمؤلف - الأدمن)
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // يشير إلى نموذج "User" (الأدمن الذي أضافه)
    },
  },
  {
    timestamps: true, // لإضافة createdAt و updatedAt
  }
);

module.exports = mongoose.model('Medicine', medicineSchema);