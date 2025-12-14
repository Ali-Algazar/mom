const mongoose = require('mongoose');

const healthUnitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'يجب إدخال اسم الوحدة الصحية'],
      unique: true,
      trim: true,
    },
    governorate: {
      type: String,
      required: [true, 'يجب تحديد المحافظة'],
      enum: [
        'القاهرة', 'الجيزة', 'الإسكندرية', 'البحيرة', 'الدقهلية', 
        'الشرقية', 'الغربية', 'القليوبية', 'المنوفية', 'كفر الشيخ', 
        'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'شمال سيناء', 
        'جنوب سيناء', 'بني سويف', 'الفيوم', 'المنيا', 'أسيوط', 
        'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 
        'الوادي الجديد', 'مطروح'
      ], // قائمة المحافظات المصرية لتجنب الأخطاء الإملائية
    },
    city: {
      type: String,
      required: [true, 'يجب تحديد المركز/المدينة'],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HealthUnit', healthUnitSchema);