// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentSingleTabManager, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Build config from env; do not allow missing keys in production
const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Provide dev-time fallbacks so local development works without .env
if (!import.meta.env.PROD) {
  cfg.apiKey ||= "AIzaSyBkjeJyvHtbsA9hA7BB26DYiW4MoME2JOs";
  cfg.authDomain ||= "loveapp-16d8b.firebaseapp.com";
  cfg.projectId ||= "loveapp-16d8b";
  cfg.storageBucket ||= "loveapp-16d8b.appspot.com";
  cfg.messagingSenderId ||= "1015545509388";
  cfg.appId ||= "1:1015545509388:web:c6f5f6c0e6f2c2c2c2c2c2";
  cfg.measurementId ||= "G-XXXXXXXXXX";
}

if (import.meta.env.PROD) {
  for (const [key, value] of Object.entries(cfg)) {
    if (!value) {
      throw new Error(`Missing required Firebase env var: ${key}`);
    }
  }
}

const firebaseConfig = cfg;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
const auth = getAuth(app);
// Guard against HMR duplicate initialization by reusing existing options
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
  });
} catch (e) {
  db = getFirestore(app);
}
const storage = getStorage(app);
// Cloud Functions (us-central1)
const functions = getFunctions(app, 'us-central1');
if (!import.meta.env.PROD) {
  try {
    connectFunctionsEmulator(functions, '127.0.0.1', 5003);
    connectFirestoreEmulator(db, '127.0.0.1', 8081);
    connectAuthEmulator(auth, 'http://127.0.0.1:9098');
  } catch (e) {
    // ignore if already connected in HMR
  }
}

export { app, db, auth, storage, functions };