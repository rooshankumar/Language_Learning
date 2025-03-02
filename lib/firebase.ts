
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

// Check if all required Firebase variables are present
const hasRequiredConfig = apiKey && authDomain && projectId && storageBucket && 
                         messagingSenderId && appId;

// Import mock services for development mode
import { mockAuth, mockFirestore, mockStorage } from './mock-auth';

// Only initialize Firebase if we're in a browser environment and have all required config
if (typeof window !== 'undefined') {
  try {
    if (!hasRequiredConfig) {
      console.error("❌ Missing required Firebase configuration variables");
      // In development, we can continue with mock services
      if (process.env.NODE_ENV === 'development') {
        console.warn("💡 Using development mode with mock Firebase services.");
        // Use mock services in development when Firebase config is missing
        auth = mockAuth as unknown as Auth;
        db = mockFirestore as unknown as Firestore;
        storage = mockStorage as unknown as FirebaseStorage;
        console.log("✅ Mock Firebase services initialized for development");
      }
    } else if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log("✅ Firebase initialized successfully");
      
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));
    } else {
      app = getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      analytics = isSupported().then((yes) => (yes ? getAnalytics(app) : null));
    }
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    
    // Use mock services when there's an error with Firebase initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.warn("💡 Falling back to mock Firebase services due to initialization error.");
      
      // Enhance mockAuth with any missing required methods
      const enhancedMockAuth = {
        ...mockAuth,
        // Add any additional methods that might be missing from the mock
        _getRecaptchaConfig: () => null,
      };
      
      auth = enhancedMockAuth as unknown as Auth;
      db = mockFirestore as unknown as Firestore;
      storage = mockStorage as unknown as FirebaseStorage;
      console.log("✅ Mock Firebase services initialized as fallback");
    } else {
      // In production, log more detailed error message
      if (error.code === 'auth/invalid-api-key') {
        console.error("The Firebase API key is invalid. Please check your environment variables.");
      }
    }
  }
}

export { app, auth, db, storage, analytics };
