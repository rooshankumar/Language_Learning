
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

// Ensure we have a valid config by checking each environment variable
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Log missing environment variables during development
if (process.env.NODE_ENV === 'development') {
  const missingVars = [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', apiKey],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', authDomain],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', projectId],
    ['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', storageBucket],
    ['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', messagingSenderId],
    ['NEXT_PUBLIC_FIREBASE_APP_ID', appId],
  ].filter(([_, value]) => !value);

  if (missingVars.length > 0) {
    console.warn(
      '⚠️ Missing environment variables:',
      missingVars.map(([name]) => name).join(', ')
    );
  }
}

// ✅ Firebase configuration using environment variables
const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

// Firebase services initialization
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let analytics: Promise<Analytics | null> | undefined;

// Only initialize Firebase if we're in a browser environment
if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized successfully");
    } else {
      app = getApp();
    }
    
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
  }
}

export { app, auth, db, storage, analytics };
