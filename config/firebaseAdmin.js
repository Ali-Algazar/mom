

const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

try {

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ [Config] Firebase Admin Initialized');
  }
} catch (error) {
  console.error('❌ [Config] Error initializing Firebase Admin:', error.message);
}


module.exports = admin;