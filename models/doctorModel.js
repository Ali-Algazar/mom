// models/doctorModel.js

const mongoose = require('mongoose');

// --- (هذا هو النموذج الخاص بالموقع الجغرافي) ---
// (نستخدم معيار GeoJSON لتخزين الإحداثيات)
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'], // النوع "نقطة"
    required: true,
  },
  coordinates: {
    type: [Number], // [خط العرض, خط الطول]
    required: true,
  },
});

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الرجاء إدخال اسم الطبيب أو المركز'],
    },
    imageUrl: {
      type: String,
      required: [true, 'الرجاءإدخال صورة الطبيب او المركز'


      ],
       default: 'https://via.placeholder.com/150?text=Medicine+Image'
      
    },
    address: {
      type: String,
      required: [true, 'الرجاء إدخال العنوان'],
    },
    phone: {
      type: String,
    },
    specialty: {
      type: String,
      default: 'أطفال وحديثي الولادة',
    },
    
    // --- (هذا هو حقل الموقع الجغرافي) ---
    location: {
      type: pointSchema,
      required: [true, 'الرجاء إدخال إحداثيات الموقع'],
      // (هذا "فهرس" خاص ليجعل البحث الجغرافي سريعاً جداً)
      index: '2dsphere',
    },

    // (رابط بالطبيب بالمؤلف - الأدمن)
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

module.exports = mongoose.model('Doctor', doctorSchema);