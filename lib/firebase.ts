
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  connectAuthEmulator, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  PhoneAuthProvider 
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let firebaseApp;
let auth;
let db;

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Check if we have the minimum required config
const hasMinConfig = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Only initialize Firebase Auth on client-side
if (hasMinConfig) {
  // Initialize Firebase app
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  
  // Initialize Firestore (works on both client and server)
  db = getFirestore(firebaseApp);
  
  // Initialize Auth only on client-side
  if (isBrowser) {
    auth = getAuth(firebaseApp);
    
    // Connect to emulators in development if configured
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
    }
    
    console.log('✅ Firebase services initialized with real config');
  } else {
    // Server-side stub for auth
    auth = {} as any;
    console.log('🔶 Firebase Auth skipped on server-side');
  }
} else {
  if (process.env.NODE_ENV === 'development') {
    // Use mock implementations for development when config is incomplete
    console.log("Using mock Firebase implementation for development");
    const { createMockAuth, createMockFirestore } = require('./mock-auth');
    auth = createMockAuth();
    db = createMockFirestore();
  } else {
    // For production without proper config, still initialize Firebase but log an error
    console.error("Missing Firebase configuration in production environment!");
    firebaseApp = getApps().length ? getApp() : initializeApp({});
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);
  }
}

// Initialize the authentication providers
const googleProvider = new GoogleAuthProvider();
// Add scopes for additional permissions
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
// Set custom parameters for login prompt
googleProvider.setCustomParameters({
  prompt: 'select_account', // Forces account selection even if already logged in
});

const githubProvider = new GithubAuthProvider();
const phoneProvider = new PhoneAuthProvider(auth);

// Log config status
if (!Object.values(firebaseConfig).every(value => !!value)) {
  const missingVars = Object.entries(firebaseConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key.replace('NEXT_PUBLIC_', ''))
    .join(', ');

  console.warn('⚠️ Missing environment variables:', missingVars);
  console.warn('⚠️ Authentication might not work correctly without proper Firebase configuration');
}

export { auth, db, googleProvider, githubProvider, phoneProvider };
