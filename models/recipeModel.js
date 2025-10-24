// models/recipeModel.js

const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'الرجاء إدخال عنوان الوصفة'],
      unique: true,
    },
    description: { // وصف بسيط
      type: String,
    },
    ingredients: { // المكونات
      type: String,
      required: [true, 'الرجاء إدخال المكونات'],
    },
    instructions: { // طريقة التحضير
      type: String,
      required: [true, 'الرجاء إدخال طريقة التحضير'],
    },
    // (المرحلة العمرية المناسبة)
    ageGroup: {
      type: String,
      required: [true, 'الرجاء تحديد الفئة العمرية (مثال: 6-8 شهور)'],
      // (ممكن نستخدم enum لو المراحل ثابتة)
      // enum: ['6-8m', '9-11m', '12m+']
    },
    // (التصنيف)
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack', 'puree'],
      default: 'puree',
    },
    // (تحذيرات أو ملاحظات)
    warnings: {
      type: String,
    },
    // (رابط الصورة)
    imageUrl: {
      type: String,
    },
    // (رابط الوصفة بالأدمن)
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

module.exports = mongoose.model('Recipe', recipeSchema);