import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
try {
  initializeApp({ projectId: 'gen-lang-client-0266183284' });
  const auth = getAuth();
  console.log('Firebase admin auth initialized');
} catch (e) {
  console.log('failed', e);
}
