"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  Auth
} from "firebase/auth";
import { setDoc, doc, getFirestore, Firestore } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateUserProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if Firebase auth is available - must be in useEffect due to SSR
  const [auth, setAuth] = useState<Auth | undefined>(undefined);
  const [db, setDb] = useState<Firestore | undefined>(undefined);

  // Initialize Firebase only on client side
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Import Firebase auth only on client side
        const { auth: clientAuth, db: clientDb } = await import("@/lib/firebase");
        // Set persistence to LOCAL to persist authentication between sessions
        const { browserLocalPersistence, setPersistence } = await import("firebase/auth");
        
        await setPersistence(clientAuth, browserLocalPersistence);
        console.log("Auth persistence set to LOCAL");
        
        // Check for stored trust device preference
        const trustDevice = localStorage.getItem("trust_device") === "true";
        if (trustDevice) {
          console.log("Using trusted device persistence");
          // We could add additional persistence options here
        }
        
        setAuth(clientAuth);
        setDb(clientDb);
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };
    
    initializeAuth();
  }, []);

  useEffect(() => {
    console.log("Setting up auth state listener");

    // Only set up the listener if auth is initialized
    if (!auth) {
      console.log("Auth not initialized yet or missing config");
      // If we're in development mode, use mock auth
      if (process.env.NODE_ENV === 'development') {
        console.warn("Running in development mode without Firebase authentication");
        setLoading(false); // Set loading to false so the app can continue
      }
      return; // Wait for auth to be initialized or for mock auth to be set up
    }

    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          console.log("Auth state changed:", user ? "User signed in" : "No user");
          setUser(user);
          setLoading(false);
        },
        (error) => {
          console.error("Auth state error:", error);
          setError(error.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Failed to set up auth state listener:", error);
      // If setting up auth state listener fails, continue without blocking the UI
      setLoading(false);
    }
  }, [auth]);

  // 🔹 Sign In (Email & Password)
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth) {
        console.error("Authentication not initialized. Check Firebase configuration.");
        setError("Authentication service is not available. Please try again later.");
        throw new Error("Authentication not initialized. Check Firebase configuration.");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful:", userCredential.user.uid);
      router.push("/");
    } catch (error: any) {
      console.error("Sign in error:", error);

      // Provide more user-friendly error messages
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError("Invalid email or password. Please try again.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many unsuccessful login attempts. Please try again later.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else if (error.code === 'auth/internal-error') {
        setError("An internal error occurred. Please try again later.");
      } else {
        setError(error.message || "Failed to sign in. Please try again.");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Sign Up (Email & Password) - Now Saves to Firestore
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || !db) {
        console.error("Authentication or database not initialized.");
        setError("Service is not available. Please try again later.");
        throw new Error("Authentication or database not initialized.");
      }
      
      // In development mode with mock auth, handle specially
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
        console.log("Using mock sign-up flow");
        
        // Create a mock user
        const mockUid = `mock-uid-${Date.now()}`;
        const mockUser = {
          uid: mockUid,
          email: email,
          displayName: name || "Anonymous",
          emailVerified: true,
          isAnonymous: false,
          photoURL: "/placeholder-user.jpg"
        } as unknown as User;
        
        try {
          // Set mock user data in Firestore
          await setDoc(doc(db, "users", mockUid), {
            uid: mockUid,
            name: name || "Anonymous",
            email,
            createdAt: new Date().toISOString(),
          });
        } catch (e) {
          console.error("Mock Firestore error:", e);
          // Continue anyway
        }
        
        setUser(mockUser);
        router.push("/onboarding");
        return;
      }

      // Real implementation for production
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      console.log("User created successfully:", newUser.uid);

      // Update profile with name if provided
      if (name) {
        await updateProfile(newUser, { displayName: name });
      }

      try {
        // 🔹 Save user to Firestore
        await setDoc(doc(db, "users", newUser.uid), {
          uid: newUser.uid,
          name: name || "Anonymous",
          email,
          createdAt: new Date().toISOString(),
        });
        console.log("User data saved to Firestore");
      } catch (firestoreError) {
        console.error("Failed to save user data to Firestore:", firestoreError);
        // Continue anyway since auth is created
      }

      setUser(newUser);
      router.push("/onboarding");
    } catch (error: any) {
      console.error("Sign up error:", error);

      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try signing in instead.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please use a stronger password.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(error.message || "Failed to create account. Please try again.");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Google Sign-In - Now Saves to Firestore
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || !db) {
        console.error("Authentication or database not initialized.");
        setError("Service is not available. Please try again later.");
        throw new Error("Authentication or database not initialized.");
      }
      
      // Import Firebase auth and providers only on client side
      const { googleProvider } = await import("@/lib/firebase");
      
      console.log("Initiating Google sign-in popup");
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      console.log("Google sign-in successful:", googleUser.uid);

      try {
        // Check if this is a new signup or returning user
        const isNewUser = googleUser.metadata.creationTime === googleUser.metadata.lastSignInTime;
        
        // 🔹 Save Google user to Firestore if first-time login
        await setDoc(doc(db, "users", googleUser.uid), {
          uid: googleUser.uid,
          name: googleUser.displayName,
          email: googleUser.email,
          photoURL: googleUser.photoURL,
          createdAt: new Date().toISOString(),
          isNewUser: isNewUser
        }, { merge: true });
        console.log("Google user data saved to Firestore");
        
        // If this is a new user, we'll want to redirect to onboarding
        if (isNewUser) {
          // Ensure we redirect to onboarding with small delay to allow state updates
          setTimeout(() => {
            router.push("/onboarding");
          }, 500);
        } else {
          setTimeout(() => {
            router.push("/");
          }, 500);
        }
      } catch (firestoreError) {
        console.error("Failed to save Google user data to Firestore:", firestoreError);
        // Continue anyway since auth is successful
        setTimeout(() => {
          router.push("/");
        }, 500);
      }

      setUser(googleUser);
      return googleUser;
    } catch (error: any) {
      console.error("Google sign in error:", error);

      // Provide more user-friendly error messages
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was canceled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Pop-up was blocked by your browser. Please allow pop-ups for this site.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(error.message || "Failed to sign in with Google. Please try again.");
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Sign Out
  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      router.push("/sign-in");
    } catch (error: any) {
      console.error("Sign out error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Reset Password
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Update User Profile (Name & Other Info)
  const updateUserProfile = async (profileData: any) => {
    try {
      setLoading(true);
      setError(null);
      if (!user) throw new Error("No authenticated user");

      // Update Firebase Authentication Profile
      if (profileData.name) {
        await updateProfile(user, { displayName: profileData.name });
      }

      // Update Firestore User Data
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      console.log("User profile updated successfully");
    } catch (error: any) {
      console.error("Update profile error:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword, 
      signInWithGoogle,
      updateUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// 🔹 Custom Hook for Authentication
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}