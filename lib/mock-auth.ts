
import { User } from "firebase/auth";
import { v4 as uuidv4 } from 'uuid';

// Mock user for development
const mockUser = {
  uid: uuidv4(),
  email: "user@example.com",
  displayName: "Test User",
  photoURL: "/placeholder-user.jpg",
  emailVerified: true,
  isAnonymous: false,
};

// Mock Firebase Auth provider
export const createMockAuth = () => {
  let currentUser: User | null = { ...mockUser } as unknown as User;
  
  const listeners: Array<(user: User | null) => void> = [];

  const auth = {
    currentUser,
    onAuthStateChanged: (callback: (user: User | null) => void) => {
      listeners.push(callback);
      // Trigger the callback with the current user
      setTimeout(() => callback(currentUser), 0);
      
      // Return an unsubscribe function
      return () => {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      };
    },
    signInWithEmailAndPassword: async () => {
      currentUser = { ...mockUser } as unknown as User;
      listeners.forEach(callback => callback(currentUser));
      return { user: currentUser };
    },
    signInWithPopup: async () => {
      currentUser = { ...mockUser } as unknown as User;
      listeners.forEach(callback => callback(currentUser));
      return { user: currentUser };
    },
    createUserWithEmailAndPassword: async () => {
      currentUser = { ...mockUser } as unknown as User;
      listeners.forEach(callback => callback(currentUser));
      return { user: currentUser };
    },
    signOut: async () => {
      currentUser = null;
      listeners.forEach(callback => callback(currentUser));
    },
    sendPasswordResetEmail: async () => Promise.resolve(),
    updateProfile: async () => Promise.resolve(),
    
    // Add missing methods needed by Firebase Auth
    _getRecaptchaConfig: () => null,
    tenantId: null,
    settings: {
      appVerificationDisabledForTesting: true
    },
    app: {
      options: {
        apiKey: 'mock-api-key'
      }
    }
  };

  return auth;
};

// Mock Firestore
export const createMockFirestore = () => {
  const mockDb = {
    // Create a mock document reference
    doc: (path) => {
      return {
        id: path.split('/').pop(),
        set: async (data, options) => Promise.resolve(),
        get: async () => ({
          exists: true,
          data: () => ({ name: "Test User", email: "user@example.com" })
        }),
        update: async (data) => Promise.resolve(),
        delete: async () => Promise.resolve(),
        collection: (collPath) => mockDb.collection(`${path}/${collPath}`)
      };
    },
    // Create a mock collection reference
    collection: (path) => {
      return {
        id: path.split('/').pop(),
        doc: (docId) => mockDb.doc(`${path}/${docId}`),
        add: async (data) => {
          const docId = `mock-doc-${Date.now()}`;
          return { id: docId, ...mockDb.doc(`${path}/${docId}`) };
        },
        where: () => ({
          get: async () => ({
            empty: false,
            docs: [
              {
                id: "user123",
                exists: true,
                data: () => ({ name: "Test User", email: "user@example.com" }),
                ref: mockDb.doc(`${path}/user123`)
              }
            ]
          })
        })
      };
    }
  };
  
  return mockDb;
};
