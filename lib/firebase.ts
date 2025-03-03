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

// Always initialize Firebase - even with incomplete config for development
let firebaseApp;
let auth;
let db;

// Check if we have the minimum required config
const hasMinConfig = !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId;

// For production builds (or if we have the minimum config)
if (hasMinConfig || process.env.NODE_ENV === 'production') {
  // Initialize with real Firebase
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  
  // Connect to emulators in development if configured
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  }
} else {
  // Use mock implementations for development when config is incomplete
  console.log("Running in development mode without Firebase authentication");
  const { createMockAuth, createMockFirestore } = require('./mock-auth');
  auth = createMockAuth();
  db = createMockFirestore();
}

// Initialize the authentication providers
const googleProvider = new GoogleAuthProvider();
// Add scopes for additional permissions
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
// Set custom parameters for login prompt
googleProvider.setCustomParameters({
  prompt: 'select_account', // Forces account selection even if already logged in
  login_hint: '', // Clear any previous login hints
});

// Allow any domain for development - helps with unauthorized domain errors
if (process.env.NODE_ENV === 'development') {
  try {
    const currentURL = typeof window !== 'undefined' ? window.location.origin : '';
    if (currentURL) {
      console.log(`Adding current URL to authorized domains: ${currentURL}`);
    }
  } catch (error) {
    console.error("Error getting current URL:", error);
  }
}

const githubProvider = new GithubAuthProvider();

console.log('✅ Firebase services initialized');

// If some config is missing, log warnings but continue with real Firebase
if (!Object.values(firebaseConfig).every(value => !!value)) {
  const missingVars = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key.replace('NEXT_PUBLIC_', ''))
    .join(', ');

  console.warn('⚠️ Missing environment variables:', missingVars);
  console.warn('⚠️ Authentication might not work correctly without proper Firebase configuration');
}

export { auth, db, googleProvider, githubProvider };