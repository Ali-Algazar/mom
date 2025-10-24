// models/childVaccinationModel.js

const mongoose = require('mongoose');

// هذا هو "سجل" التطعيم الفعلي للطفل
const childVaccinationSchema = new mongoose.Schema(
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
    // --- (3. الربط بالتطعيم الرئيسي) ---
    vaccine: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vaccine', // يشير إلى التطعيم من القائمة الرئيسية
    },
    
    // --- (4. بيانات المتابعة) ---
    dueDate: {
      type: Date,
      required: true, // تاريخ الاستحقاق المحسوب
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'done', 'missed'], // (قادم، تم، فات الميعاد)
      default: 'pending',
    },
    // (تاريخ إعطاء الجرعة الفعلي - تسجله الأم)
    dateAdministered: {
      type: Date, // يكون "null" طالما الحالة "pending"
    },
    
    // (يمكن إضافة ملاحظات هنا)
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// (إضافة "فهرس" لضمان عدم تكرار نفس التطعيم لنفس الطفل)
childVaccinationSchema.index({ child: 1, vaccine: 1 }, { unique: true });

module.exports = mongoose.model('ChildVaccination', childVaccinationSchema);