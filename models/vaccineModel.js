// models/vaccineModel.js

const mongoose = require('mongoose');

// هذه هي "القائمة الرئيسية" للتطعيمات الإجبارية
const vaccineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال اسم التطعيم'],
      unique: true, // لا نريد تطعيمين بنفس الاسم
    },
    description: {
      type: String,
      required: [true, 'الرجاء إدخال وصف للتطعيم'],
    },
    // هذا هو أهم حقل: متى يُعطى هذا التطعيم؟
    ageInMonths: {
      type: Number,
      required: [
        true,
        'الرجاء تحديد العمر بالأشهر (مثال: 2 شهر، 4 شهور)',
      ],
      // 0 = عند الولادة
    },
    doseInfo: {
      type: String,
      default: 'جرعة واحدة', // مثال: "الجرعة الأولى"، "جرعة منشطة"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vaccine', vaccineSchema);