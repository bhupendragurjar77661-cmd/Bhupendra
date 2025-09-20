// FIX: Changed firebase imports to namespace imports to resolve module resolution issues.
import * as firebaseApp from 'firebase/app';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import * as firebaseStorage from 'firebase/storage';

// --- FIREBASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyCx1PdhBpxXCl9f56waTp4QBjFa2rKgDPY",
    authDomain: "edgeplus-app.firebaseapp.com",
    projectId: "edgeplus-app",
    storageBucket: "edgeplus-app.appspot.com",
    messagingSenderId: "997518043564",
    appId: "1:997518043564:web:e33f6912cd87533204b209",
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = firebaseAuth.getAuth(app);
export const storage = firebaseStorage.getStorage(app);
export const db = firestore.getFirestore(app);

// Export serverTimestamp for use in components
export const serverTimestamp = firestore.serverTimestamp;

// Enable Firestore offline persistence
firestore.enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence could not be enabled: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence could not be enabled: Browser does not support it.');
    }
  });
