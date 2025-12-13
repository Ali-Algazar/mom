const mongoose = require('mongoose');

const childSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال اسم الطفل'],
    },
    // الرقم القومي للطفل (من شهادة الميلاد)
    nationalId: {
      type: String,
      required: [true, 'الرجاء إدخال الرقم القومي للطفل'],
      unique: true,
      length: 14,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'الرجاء إدخال تاريخ الميلاد'],
    },
    gender: {
      type: String,
      enum: ['boy', 'girl'],
      required: [true, 'الرجاء اختيار النوع'],
    },
    
    // --- التعديل الجوهري: الربط بالأم ---
    // ده الرقم اللي الموظف هيدخله وهو بيسجل الطفل
    motherNationalId: {
      type: String,
      required: [true, 'الرجاء إدخال الرقم القومي للأم'], 
      index: true // عشان البحث بيه يكون سريع
    },

    // ده هيتملي "أوتوماتيك" لما الأم تعمل حساب وتدخل رقمها القومي
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // --- مكان التسجيل (عزل البيانات) ---
    // السيستم هياخد البيانات دي أوتوماتيك من الموظف اللي سجل الطفل
    registeredAt: {
      governorate: { type: String, required: true },
      city: { type: String, required: true },
      healthUnit: { type: String, required: true }
    },

    // مين الموظف اللي قام بالإضافة؟
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Child', childSchema);