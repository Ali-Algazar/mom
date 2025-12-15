const mongoose = require('mongoose');

// --- (هذا هو النموذج الخاص بالموقع الجغرافي) ---
const pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'], // النوع "نقطة"
    required: true,
  },
  coordinates: {
    type: [Number], // [خط الطول, خط العرض]
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
      required: [true, 'الرجاء إدخال صورة الطبيب او المركز'],
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
      index: '2dsphere', // فهرس جغرافي للبحث السريع
    },

    // (رابط بالطبيب بالمؤلف - الأدمن)
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

module.exports = mongoose.model('Doctor', doctorSchema);