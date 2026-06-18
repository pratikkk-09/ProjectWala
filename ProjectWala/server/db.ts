import { initFirebaseDb } from './firebaseStore.js';

export const connectDB = async () => {
  const db = initFirebaseDb();
  if (db) {
     return true;
  }
  return false;
};
