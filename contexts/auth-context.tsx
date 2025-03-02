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
  updateProfile
} from "firebase/auth";
import { setDoc, doc, getFirestore } from "firebase/firestore";
import { auth } from "@/lib/firebase";
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
  const db = getFirestore();

  useEffect(() => {
    console.log("Setting up auth state listener");
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
  }, []);

  // 🔹 Sign In (Email & Password)
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (error: any) {
      console.error("Sign in error:", error);
      setError(error.message);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Update profile with name if provided
      if (name) {
        await updateProfile(newUser, { displayName: name });
      }

      // 🔹 Save user to Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        name: name || "Anonymous",
        email,
        createdAt: new Date().toISOString(),
      });

      setUser(newUser);
      router.push("/onboarding");
    } catch (error: any) {
      console.error("Sign up error:", error);
      setError(error.message);
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
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // 🔹 Save Google user to Firestore if first-time login
      await setDoc(doc(db, "users", googleUser.uid), {
        uid: googleUser.uid,
        name: googleUser.displayName,
        email: googleUser.email,
        createdAt: new Date().toISOString(),
      }, { merge: true });

      setUser(googleUser);
    } catch (error: any) {
      console.error("Google sign in error:", error);
      setError(error.message);
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
