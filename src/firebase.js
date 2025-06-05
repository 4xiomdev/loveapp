// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Use Vite environment variables with fallbacks for production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBkjeJyvHtbsA9hA7BB26DYiW4MoME2JOs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "loveapp-16d8b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "loveapp-16d8b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "loveapp-16d8b.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1015545509388",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1015545509388:web:c6f5f6c0e6f2c2c2c2c2c2",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, auth, storage };