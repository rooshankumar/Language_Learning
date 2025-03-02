
// This file provides a mock authentication service for development
// when Firebase credentials are not available

import { User } from "firebase/auth";

// Mock user for development
const MOCK_USER: User = {
  uid: 'dev-user-123',
  email: 'dev@example.com',
  displayName: 'Development User',
  emailVerified: true,
  isAnonymous: false,
  photoURL: '/placeholder-user.jpg',
  providerId: 'password',
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-id-token',
  getIdTokenResult: async () => ({
    token: 'mock-id-token',
    signInProvider: 'password',
    expirationTime: new Date(Date.now() + 3600000).toISOString(),
    issuedAtTime: new Date().toISOString(),
    authTime: new Date().toISOString(),
    claims: {},
  }),
  reload: async () => {},
  toJSON: () => ({}),
  phoneNumber: null,
};

// Mock authentication functions
export const mockAuth = {
  currentUser: MOCK_USER,
  signInWithEmailAndPassword: async (email: string, password: string) => {
    console.log('Mock sign in with:', email);
    return { user: MOCK_USER };
  },
  createUserWithEmailAndPassword: async (email: string, password: string) => {
    console.log('Mock sign up with:', email);
    return { user: MOCK_USER };
  },
  signOut: async () => {
    console.log('Mock sign out');
  },
  onAuthStateChanged: (callback: any) => {
    // Simulate auth state change with a mock user
    setTimeout(() => callback(MOCK_USER), 500);
    // Return mock unsubscribe function
    return () => {};
  },
  sendPasswordResetEmail: async (email: string) => {
    console.log('Mock password reset for:', email);
  },
  updateProfile: async (user: any, data: any) => {
    console.log('Mock update profile:', data);
  },
};

// Mock Firestore
export const mockFirestore = {
  collection: () => ({
    doc: () => ({
      get: async () => ({
        exists: true,
        data: () => ({}),
      }),
      set: async (data: any) => {
        console.log('Mock firestore set:', data);
      },
      update: async (data: any) => {
        console.log('Mock firestore update:', data);
      },
    }),
    add: async (data: any) => {
      console.log('Mock firestore add:', data);
      return { id: 'mock-doc-id' };
    },
    where: () => ({
      get: async () => ({
        docs: [],
        forEach: () => {},
      }),
    }),
  }),
  doc: () => ({
    set: async (data: any) => {
      console.log('Mock firestore set doc:', data);
    },
    get: async () => ({
      exists: true,
      data: () => ({}),
    }),
  }),
};

// Mock Storage
export const mockStorage = {
  ref: () => ({
    put: async () => ({
      ref: {
        getDownloadURL: async () => '/placeholder-user.jpg',
      },
    }),
    getDownloadURL: async () => '/placeholder-user.jpg',
  }),
};
