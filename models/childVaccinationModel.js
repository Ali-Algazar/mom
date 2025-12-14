const mongoose = require('mongoose');

const childVaccinationSchema = new mongoose.Schema(
  {
    // ❌ تم حذف حقل parent لأنه يسبب خطأ عند تسجيل الموظف للطفل
    // (يمكننا الوصول للأم دائماً عن طريق حقل child)

    // --- (1. الربط بالطفل) ---
    child: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Child',
    },
    
    // --- (2. الربط بالتطعيم الرئيسي) ---
    vaccine: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Vaccine',
    },

    // (حقل إضافي لتخزين اسم التطعيم لتسهيل العرض بدون Populate)
    vaccineName: { 
      type: String 
    }, 
    
    // --- (3. بيانات المتابعة) ---
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'missed'], 
      default: 'pending',
    },
    
    // تاريخ إعطاء الجرعة الفعلي
    dateAdministered: {
      type: Date,
    },
    
    // ملاحظات الموظف
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// منع تكرار نفس التطعيم لنفس الطفل
childVaccinationSchema.index({ child: 1, vaccine: 1 }, { unique: true });

module.exports = mongoose.model('ChildVaccination', childVaccinationSchema);