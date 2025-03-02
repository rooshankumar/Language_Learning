// This file provides a mock authentication service for development
// when Firebase credentials are not available

import { User } from "firebase/auth";
import { v4 as uuidv4 } from 'uuid';

// Mock user for development
const mockUser = {
  uid: "mock-user-id",
  email: "mockuser@example.com",
  displayName: "Mock User",
  photoURL: "/placeholder-user.jpg",
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  getIdToken: () => Promise.resolve("mock-id-token"),
  reload: () => Promise.resolve(),
};

// Mock authentication methods
export const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: (callback) => {
    // Simulate an authenticated user
    callback(mockUser);
    return () => {}; // Return unsubscribe function
  },
  signInWithEmailAndPassword: (email, password) => {
    return Promise.resolve({ user: mockUser });
  },
  createUserWithEmailAndPassword: (email, password) => {
    return Promise.resolve({ user: { ...mockUser, email, uid: uuidv4() } });
  },
  signOut: () => Promise.resolve(),
  signInWithPopup: () => Promise.resolve({ user: mockUser }),
  sendPasswordResetEmail: () => Promise.resolve(),
  updateProfile: () => Promise.resolve(),
  // Add this to fix the _getRecaptchaConfig error
  _getRecaptchaConfig: () => null,
};

// Mock Firestore methods
export const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: () => Promise.resolve({
        exists: true,
        data: () => ({ name: 'Mock User', email: 'mockuser@example.com' }),
      }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
    }),
  }),
  doc: () => ({
    get: () => Promise.resolve({
      exists: true,
      data: () => ({ name: 'Mock User', email: 'mockuser@example.com' }),
    }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
  }),
};

// Mock Storage methods
export const mockStorage = {
  ref: () => ({
    put: () => Promise.resolve({
      ref: {
        getDownloadURL: () => Promise.resolve("https://example.com/image.jpg"),
      },
    }),
    getDownloadURL: () => Promise.resolve("https://example.com/image.jpg"),
  }),
};