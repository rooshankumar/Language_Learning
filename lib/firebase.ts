import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDWHbRT_cTF8fjLdUrcGoQTjV75-_jtgfE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "language-learning-app-d2e87.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "language-learning-app-d2e87",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "language-learning-app-d2e87.appspot.com", // ✅ Fixed here
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "185365385543",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:185365385543:web:e8bd7e3fa48b1a7ee63c62",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7ZPNFEBPC5",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics and export it
const analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));

export { app, auth, db, storage, analytics };

