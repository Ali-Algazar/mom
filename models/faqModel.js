// models/faqModel.js

const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'الرجاء إدخال نص السؤال'],
      unique: true,
    },
    answer: {
      type: String,
      required: [true, 'الرجاء إدخال الإجابة الجاهزة'],
    },
    // (لتصنيف الأسئلة، مثلما فعلنا في المقالات)
    category: {
      type: String,
      required: true,
      enum: [
        'vaccination', // عن التطعيمات
        'feeding',     // عن الرضاعة
        'growth',      // عن النمو
        'general',     // أسئلة عامة
      ],
      default: 'general',
    },
    // (يمكن إضافة "كلمات مفتاحية" لمساعدة البوت في البحث)
    keywords: [String],

    // (رابط السؤال بالمؤلف - الأدمن)
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // يشير إلى نموذج "User" (الأدمن الذي أضافه)
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Faq', faqSchema);