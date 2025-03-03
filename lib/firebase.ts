import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  connectAuthEmulator, 
  GoogleAuthProvider, 
  GithubAuthProvider 
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { createMockAuth, createMockFirestore } from "./mock-auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required Firebase config variables are present
const hasAllConfig = Object.values(firebaseConfig).every(value => !!value);

// Initialize Firebase
let firebaseApp;
let auth;
let db;
let googleProvider;
let githubProvider;

// Development mode check to catch issues during build
const isDevelopment = process.env.NODE_ENV === 'development';

if (hasAllConfig) {
  // Normal Firebase initialization with actual config
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  googleProvider = new GoogleAuthProvider();
  githubProvider = new GithubAuthProvider();

  // Optionally connect to emulators in development
  if (isDevelopment && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }

  console.log('✅ Firebase services initialized with configuration');
} else {
  // Mock implementation for development without Firebase config
  console.log('Running in development mode without Firebase authentication');
  const missingVars = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key.replace('NEXT_PUBLIC_', ''))
    .join(', ');

  console.warn('⚠️ Missing environment variables:', missingVars);
  console.log('💡 Using development mode with mock Firebase services.');

  // Create mock services
  auth = createMockAuth();
  db = createMockFirestore();
  googleProvider = {}; // Mock provider, just an empty object
  githubProvider = {}; // Mock provider, just an empty object

  console.log('✅ Mock Firebase services initialized for development');
}

export { auth, db, googleProvider, githubProvider };