// config/firebaseAdmin.js

const admin = require('firebase-admin');

// --- (1. قراءة المفتاح من متغير البيئة) ---
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING) {
     // (تحويل النص من متغير البيئة обратно لـ JSON object)
     serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON_STRING);
  } else {
     console.error('❌ [Config] Environment variable FIREBASE_SERVICE_ACCOUNT_JSON_STRING is not set!');
     throw new Error('Firebase service account key configuration is missing.');
  }
} catch (error) {
   console.error('❌ [Config] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON_STRING:', error.message);
   throw new Error('Firebase service account key configuration is invalid.');
}
// ------------------------------------

try {
  // التحقق مما إذا كان قد تم تهيئته من قبل
  if (!admin.apps.length) {
    admin.initializeApp({
      // --- (2. استخدام الـ object اللي قرأناه) ---
      credential: admin.credential.cert(serviceAccount),
      // ------------------------------------------
    });
    console.log('✅ [Config] Firebase Admin Initialized from ENV variable');
  }
} catch (error) {
  console.error('❌ [Config] Error initializing Firebase Admin:', error.message);
}

// تصدير كائن admin الرئيسي مباشرة
module.exports = admin;