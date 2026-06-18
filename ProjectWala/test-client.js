import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  try {
    await setDoc(doc(db, 'test-collection', 'doc1'), { test: true });
    console.log('Success!');
    process.exit(0);
  } catch (err) {
    console.error('Failure:', err);
    process.exit(1);
  }
}
test();
