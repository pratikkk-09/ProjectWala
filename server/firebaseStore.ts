import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

export const initFirebaseDb = () => {
  if (db) return db;
  try {
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      console.log('✅ Firebase Firestore Connected');
      return db;
    }
  } catch (error: any) {
    console.error('❌ Firebase Init Error:', error.message);
  }
  return null;
};

export const getDb = () => db;
