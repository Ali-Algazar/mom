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
    keywords: [String], // الكلمات المفتاحية
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Faq', faqSchema);