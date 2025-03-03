
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
  Auth,
  PhoneAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier
} from "firebase/auth";
import { setDoc, doc, getFirestore, Firestore } from "firebase/firestore";
import { auth as firebaseAuth, db as firebaseDb, googleProvider, phoneProvider } from "@/lib/firebase";
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
  signInWithPhone: (phoneNumber: string, recaptchaContainer: string) => Promise<string>;
  confirmPhoneCode: (verificationId: string, code: string) => Promise<void>;
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
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  // Initialize Firebase only on client side
  useEffect(() => {
    // Guard to ensure we only run in browser environment
    if (typeof window === 'undefined') return;
    
    const initializeAuth = async () => {
      try {
        // Import Firebase auth only on client side
        const { auth: clientAuth, db: clientDb } = await import("@/lib/firebase");
        // Set persistence to LOCAL to persist authentication between sessions
        const { browserLocalPersistence, setPersistence } = await import("firebase/auth");
        
        // Ensure clientAuth is not empty (server-side stub)
        if (clientAuth && clientAuth.setPersistence) {
          await setPersistence(clientAuth, browserLocalPersistence);
          console.log("Auth persistence set to LOCAL");
          
          // Check for stored trust device preference
          const trustDevice = localStorage.getItem("trust_device") === "true";
          if (trustDevice) {
            console.log("Using trusted device persistence");
            // We could add additional persistence options here
          }
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

  // 🔹 Phone Authentication
  const signInWithPhone = async (phoneNumber: string, recaptchaContainerId: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth) {
        console.error("Authentication not initialized.");
        setError("Authentication service is not available. Please try again later.");
        throw new Error("Authentication not initialized.");
      }

      // Only create RecaptchaVerifier in browser environment
      if (typeof window !== 'undefined') {
        // Create RecaptchaVerifier
        const { RecaptchaVerifier } = await import("firebase/auth");
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
          size: 'normal',
          callback: (response: any) => {
            console.log("reCAPTCHA verified");
          },
          'expired-callback': () => {
            console.log("reCAPTCHA expired");
            setError("reCAPTCHA verification expired. Please try again.");
          }
        });
        
        setRecaptchaVerifier(verifier);
        
        // Send verification code
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
        console.log("SMS sent to", phoneNumber);
        
        // Return verificationId to be used in confirmPhoneCode
        return confirmationResult.verificationId;
      } else {
        throw new Error("Phone authentication requires browser environment.");
      }
    } catch (error: any) {
      console.error("Phone sign in error:", error);
      
      if (error.code === 'auth/invalid-phone-number') {
        setError("Invalid phone number. Please enter a valid phone number.");
      } else if (error.code === 'auth/too-many-requests') {
        setError("Too many requests. Please try again later.");
      } else if (error.code === 'auth/captcha-check-failed') {
        setError("reCAPTCHA verification failed. Please try again.");
      } else {
        setError(error.message || "Failed to send verification code. Please try again.");
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Confirm Phone Code
  const confirmPhoneCode = async (verificationId: string, code: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!auth || !db) {
        console.error("Authentication or database not initialized.");
        setError("Service is not available. Please try again later.");
        throw new Error("Authentication or database not initialized.");
      }

      // Create credential with verification ID and code
      const { PhoneAuthProvider } = await import("firebase/auth");
      const credential = PhoneAuthProvider.credential(verificationId, code);
      
      // Sign in with credential
      const { signInWithCredential } = await import("firebase/auth");
      const userCredential = await signInWithCredential(auth, credential);
      const phoneUser = userCredential.user;
      
      // Check if this is a new signup or returning user
      const isNewUser = phoneUser.metadata.creationTime === phoneUser.metadata.lastSignInTime;
      
      // Save phone user to Firestore
      await setDoc(doc(db, "users", phoneUser.uid), {
        uid: phoneUser.uid,
        phoneNumber: phoneUser.phoneNumber,
        createdAt: new Date().toISOString(),
        isNewUser: isNewUser
      }, { merge: true });
      
      setUser(phoneUser);
      
      // Redirect based on whether this is a new user
      if (isNewUser) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (error: any) {
      console.error("Phone verification error:", error);
      
      if (error.code === 'auth/invalid-verification-code') {
        setError("Invalid verification code. Please check and try again.");
      } else if (error.code === 'auth/code-expired') {
        setError("Verification code has expired. Please request a new code.");
      } else {
        setError(error.message || "Failed to verify phone number. Please try again.");
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
      signInWithPhone,
      confirmPhoneCode,
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
