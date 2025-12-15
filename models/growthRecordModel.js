const mongoose = require('mongoose');

const growthRecordSchema = new mongoose.Schema(
  {
    // 🔥 التعديل: parentUser بدلاً من parent 🔥
    parentUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    child: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Child',
    },
    
    // بيانات القياس
    weight: {
      type: Number, // بالكيلوجرام
      required: [true, 'الرجاء إدخال الوزن'],
    },
    height: {
      type: Number, // بالسنتيمتر
      required: [true, 'الرجاء إدخال الطول'],
    },
    headCircumference: {
      type: Number, // محيط الرأس (اختياري بس مهم طبياً)
    },
    
    dateOfMeasurement: {
      type: Date,
      required: true,
      default: Date.now,
    },
    
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// فهرس لترتيب القياسات
growthRecordSchema.index({ child: 1, dateOfMeasurement: -1 });

module.exports = mongoose.model('GrowthRecord', growthRecordSchema);