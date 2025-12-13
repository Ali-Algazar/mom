const admin = require('firebase-admin');

let serviceAccount;

try {
  // السيناريو 1: نحن على Vercel (نقرأ من متغير البيئة)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
    console.log('✅ [Config] Loaded Firebase credentials from Environment Variable.');
  } 
  // السيناريو 2: نحن على الجهاز المحلي (نقرأ من الملف)
  else {
    // نحاول استيراد الملف المحلي
    // (نستخدم try/catch عشان لو الملف مش موجود الكود مايضربش)
    serviceAccount = require('./serviceAccountKey.json');
    console.log('✅ [Config] Loaded Firebase credentials from local file.');
  }
} catch (error) {
  console.error('⚠️ [Config Warning] Could not load Firebase credentials.');
  console.error('Details:', error.message);
}

// تهيئة Firebase فقط إذا نجحنا في جلب المفاتيح
if (serviceAccount) {
  // نتأكد إنه لم يتم تهيئته مسبقاً
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('🚀 Firebase Admin Initialized successfully.');
  }
} else {
  console.warn('❌ [Config Error] Firebase service account key is missing! Notifications will NOT work.');
  // لن نوقف السيرفر (process.exit) حتى لا يتوقف المشروع بالكامل، 
  // لكن الإشعارات لن تعمل.
}

module.exports = admin;