"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { cookies } from "next/headers"

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  updateUserProfile: (profileData: any) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log("Auth state changed:", user ? "User signed in" : "No user")
        setUser(user)
        if (user) {
          // Set auth cookie when user is logged in
          user.getIdToken().then(token => {
            document.cookie = `auth=${token}; max-age=${60 * 60 * 24 * 7}; path=/`; // 1 week
          })
        } else {
          // Remove auth cookie when user is logged out
          document.cookie = "auth=; max-age=0; path=/";
        }
        setLoading(false)
      },
      (error) => {
        console.error("Auth state error:", error)
        setError(error.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      router.push("/")
    } catch (error: any) {
      console.error("Sign in error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true)
      setError(null)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update profile with name if provided
      if (name && userCredential.user) {
        const { updateProfile } = await import('firebase/auth')
        await updateProfile(userCredential.user, {
          displayName: name
        })
      }
      
      router.push("/onboarding")
    } catch (error: any) {
      console.error("Sign up error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)
      await firebaseSignOut(auth)
      document.cookie = "auth=; max-age=0; path=/";
      router.push("/sign-in")
    } catch (error: any) {
      console.error("Sign out error:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error("Reset password error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      setError(null)
      const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log("Google sign in successful:", result.user)
      return result.user
    } catch (error: any) {
      console.error("Google sign in error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (profileData: any) => {
    try {
      setLoading(true)
      setError(null)
      if (!user) throw new Error("No authenticated user")
      
      const { updateProfile } = await import('firebase/auth')
      const { setDoc, doc } = await import('firebase/firestore')
      const { getFirestore } = await import('firebase/firestore')
      
      // Update display name if provided
      if (profileData.name) {
        await updateProfile(user, { displayName: profileData.name })
      }
      
      // Update user document in Firestore
      const db = getFirestore()
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      
      console.log("User profile updated successfully")
    } catch (error: any) {
      console.error("Update profile error:", error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

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
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}