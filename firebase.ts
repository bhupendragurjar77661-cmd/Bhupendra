// FIX: The firebase V8 API surface is used in this file, but the installed SDK is likely V9 or newer. Using the 'compat' libraries provides a compatibility layer for the V8 API, resolving errors with initialization and service access.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

// --- FIREBASE SETUP ---
// IMPORTANT: Replace the placeholder values below with your actual Firebase project configuration.
// You can find this in your Firebase project settings.
const firebaseConfig = {
    apiKey: "AIzaSyCx1PdhBpxXCl9f56waTp4QBjFa2rKgDPY",
    authDomain: "edgeplus-app.firebaseapp.com",
    projectId: "edgeplus-app",
    storageBucket: "edgeplus-app.firebasestorage.app",
    messagingSenderId: "997518043564",
    appId: "1:997518043564:web:e33f6912cd87533204b209",
};

// Initialize Firebase, preventing re-initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize and export Firebase services
export const auth = firebase.auth();
export const storage = firebase.storage();
export const db = firebase.firestore();

// Export serverTimestamp for use in components
export const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

// Enable Firestore offline persistence
db.enablePersistence()
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence could not be enabled: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence could not be enabled: Browser does not support it.');
    }
  });
