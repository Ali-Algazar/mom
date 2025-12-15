const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال اسم الدواء'],
      unique: true,
    },
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/150?text=Medicine+Image'
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
    // (رابط الدواء بالمؤلف - الأدمن)
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

module.exports = mongoose.model('Medicine', medicineSchema);