const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال الاسم'],
    },
    email: {
      type: String,
      required: [true, 'الرجاء إدخال البريد الإلكتروني'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'الرجاء إدخال كلمة المرور'],
      minlength: 6,
      select: false,
    },
    // --- التعديل الجوهري الأول: الرقم القومي ---
    // ده هيكون هو "مفتاح الربط" بين الأم وأطفالها
    nationalId: {
      type: String,
      required: [true, 'الرجاء إدخال الرقم القومي'],
      unique: true, // لازم يكون فريد ومميز
      length: 14,   // الرقم القومي المصري 14 رقم
      trim: true,
    },
    // --- التعديل الثاني: الصلاحيات الجديدة ---
    role: {
      type: String,
      enum: ['user', 'staff', 'super_admin'], // user=أم, staff=موظف صحة, super_admin=وزارة
      default: 'user',
    },
    // --- التعديل الثالث: مكان العمل (للموظفين فقط) ---
    workplace: {
      governorate: { type: String }, // المحافظة
      city: { type: String },        // المركز/المدينة
      healthUnit: { type: String }   // اسم الوحدة الصحية
    },
    // --- باقي الحقول زي ما هي ---
    fcmToken: {
      type: String,
      default: null,
    },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    avatar: { type: String }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);