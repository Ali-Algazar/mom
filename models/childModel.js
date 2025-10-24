// models/childModel.js

const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    // --- (1. الربط مع نموذج "الأم" - أهم حقل) ---
    // هذا يخبر Mongoose أن هذا الحقل هو "مفتاح أجنبي" (Foreign Key)
    // يشير إلى "id" من نموذج "User".
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // اسم النموذج الذي نشير إليه
    },
    // --- (2. بيانات الطفل الأساسية) ---
    name: {
      type: String,
      required: [true, 'الرجاء إدخال اسم الطفل'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'الرجاء إدخال تاريخ ميلاد الطفل'],
    },
    gender: {
      type: String,
      required: [true, 'الرجاء تحديد نوع الطفل'],
      enum: ['boy', 'girl'], // القيم المسموحة فقط
    },
    // (لاحقاً يمكن إضافة صورة، فصيلة الدم، إلخ.)
  },
  {
    timestamps: true, // لإضافة createdAt و updatedAt
  }
);

module.exports = mongoose.model('Child', childSchema);