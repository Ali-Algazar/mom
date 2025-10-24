// config/firebaseAdmin.js

const admin = require('firebase-admin');
// --- (1. استيراد مكتبة path) ---
const path = require('path');

// --- (2. بناء المسار الصحيح للمفتاح) ---
// path.join(__dirname, 'serviceAccountKey.json')
// معناه: "هات المسار بتاع المجلد اللي أنا فيه (__dirname)
//         وضيف عليه اسم الملف serviceAccountKey.json"
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
   console.error(`❌ [Config] Failed to load service account key from ${serviceAccountPath}:`, error.message);
   // لا تكمل إذا فشل تحميل المفتاح
   throw new Error('Firebase service account key not found or invalid.');
}
// ------------------------------------

try {
  // التحقق مما إذا كان قد تم تهيئته من قبل
  if (!admin.apps.length) {
    admin.initializeApp({
      // --- (3. استخدام المتغير اللي فيه المفتاح) ---
      credential: admin.credential.cert(serviceAccount),
      // ------------------------------------------
    });
    console.log('✅ [Config] Firebase Admin Initialized');
  }
} catch (error) {
  console.error('❌ [Config] Error initializing Firebase Admin:', error.message);
}

// تصدير كائن admin الرئيسي مباشرة
module.exports = admin;