import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAtpQVOTTEm2zx3L0E0lsA6YFyLB6T1MC8",
  authDomain: "halpi---bolt-3.firebaseapp.com",
  projectId: "halpi---bolt-3",
  storageBucket: "halpi---bolt-3.firebasestorage.app",
  messagingSenderId: "489276997586",
  appId: "1:489276997586:web:89babd73e16dab4564d20b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);