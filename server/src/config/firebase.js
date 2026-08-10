import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let db;

try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-key.json';
  const resolvedPath = path.resolve(serviceAccountPath);
  let app;

  if (fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✅ Firebase initialized via service account key file');
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      })
    });
    console.log('✅ Firebase initialized via environment variables');
  } else {
    console.warn('⚠️ No Firebase credentials found. Initializing with default config (local emulation / default credentials)...');
    app = initializeApp();
  }

  db = getFirestore(app);
  db.settings({ ignoreUndefinedValues: true });

} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
}

export { db };
