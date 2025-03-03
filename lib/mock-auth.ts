
import { v4 as uuidv4 } from 'uuid';

// Mock user for development
const mockUser = {
  uid: `mock-uid-${Date.now()}`,
  email: "dev@example.com",
  displayName: "Development User",
  emailVerified: true,
  isAnonymous: false,
  photoURL: "/placeholder-user.jpg"
};

// Mock Auth
export const createMockAuth = () => {
  const listeners = [];
  
  const auth = {
    currentUser: mockUser,
    onAuthStateChanged: (listener) => {
      // Call the listener immediately with the mock user
      setTimeout(() => listener(mockUser), 100);
      
      // Store listener for future reference
      listeners.push(listener);
      
      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
    signInWithEmailAndPassword: async () => {
      return { user: mockUser };
    },
    createUserWithEmailAndPassword: async () => {
      return { user: mockUser };
    },
    signOut: async () => {
      return Promise.resolve();
    },
    signInWithPopup: async () => {
      return { user: mockUser };
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
          }),
          orderBy: () => ({
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
            }),
            onSnapshot: (callback) => {
              callback({
                empty: false,
                docs: [
                  {
                    id: "user123",
                    exists: true,
                    data: () => ({ name: "Test User", email: "user@example.com" }),
                    ref: mockDb.doc(`${path}/user123`)
                  }
                ]
              });
              return () => {};
            }
          }),
          onSnapshot: (callback) => {
            callback({
              empty: false,
              docs: [
                {
                  id: "user123",
                  exists: true,
                  data: () => ({ name: "Test User", email: "user@example.com" }),
                  ref: mockDb.doc(`${path}/user123`)
                }
              ]
            });
            return () => {};
          }
        }),
        orderBy: () => ({
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
          }),
          onSnapshot: (callback) => {
            callback({
              empty: false,
              docs: [
                {
                  id: "user123",
                  exists: true,
                  data: () => ({ name: "Test User", email: "user@example.com" }),
                  ref: mockDb.doc(`${path}/user123`)
                }
              ]
            });
            return () => {};
          }
        }),
        onSnapshot: (callback) => {
          callback({
            empty: false,
            docs: [
              {
                id: "user123",
                exists: true,
                data: () => ({ name: "Test User", email: "user@example.com" }),
                ref: mockDb.doc(`${path}/user123`)
              }
            ]
          });
          return () => {};
        }
      };
    }
  };
  
  return mockDb;
};
