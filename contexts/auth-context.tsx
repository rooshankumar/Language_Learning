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
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
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

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      await createUserWithEmailAndPassword(auth, email, password)
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

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, resetPassword }}>
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