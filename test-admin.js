import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'gen-lang-client-0266183284'
  });
  const db = getFirestore('ai-studio-6c0c2100-fc5b-4a9d-a306-485e10f18f46');
  await db.collection('test').doc('test').set({ value: 1 });
  console.log('Admin Firestore works!');
} catch (error) {
  console.error('Error:', error);
}
