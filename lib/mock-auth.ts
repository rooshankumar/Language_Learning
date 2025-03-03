
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
  return {
    collection: () => ({
      doc: () => ({
        set: async () => Promise.resolve(),
        get: async () => ({
          exists: true,
          data: () => ({ name: "Test User", email: "user@example.com" })
        }),
        update: async () => Promise.resolve()
      }),
      where: () => ({
        get: async () => ({
          empty: false,
          docs: [
            {
              exists: true,
              data: () => ({ name: "Test User", email: "user@example.com" }),
              id: "user123"
            }
          ]
        })
      }),
      add: async () => Promise.resolve({ id: "doc123" })
    })
  };
};
