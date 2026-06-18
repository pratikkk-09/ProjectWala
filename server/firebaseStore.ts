import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

export const initFirebaseDb = () => {
  if (db) return db;
  try {
    let firebaseConfig;

    // Check for environment variable first (useful for hosting like Render)
    if (process.env.FIREBASE_CONFIG_JSON) {
      const parsed = JSON.parse(process.env.FIREBASE_CONFIG_JSON);
      if (parsed.projectId !== 'your-app' && parsed.projectId !== '...') {
        firebaseConfig = parsed;
      } else if (fs.existsSync(configPath)) {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } 
    // Fallback to local file in development
    else if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (firebaseConfig) {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
      console.log('✅ Firebase Firestore Connected');
      return db;
    } else {
      console.warn('⚠️ Firebase configuration not found in FIREBASE_CONFIG_JSON env variable or firebase-applet-config.json');
    }
  } catch (error: any) {
    console.error('❌ Firebase Init Error:', error.message);
  }
  return null;
};

export const getDb = () => db;
