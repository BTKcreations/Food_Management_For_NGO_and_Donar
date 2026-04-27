const admin = require('firebase-admin');
const path = require('path');

// 🛡️ To get this file:
// 1. Go to Firebase Console -> Project Settings -> Service Accounts
// 2. Click "Generate New Private Key"
// 3. Save it as "serviceAccountKey.json" inside the "server/config" folder
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  // Check if the service account file exists before initializing
  // This prevents the server from crashing if the file is missing during setup
  const fs = require('fs');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Admin SDK Initialized');
  } else {
    console.warn('⚠️ Firebase serviceAccountKey.json missing. Firebase Auth will be disabled.');
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;
