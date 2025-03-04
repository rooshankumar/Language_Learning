
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Dashboard } from "@/components/dashboard"
import { useAuth } from "@/contexts/auth-context"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // For first-time users, check if we need to redirect to onboarding
  useEffect(() => {
    if (!loading && user) {
      // Check if this user has completed onboarding
      const checkOnboardingStatus = async () => {
        try {
          const { doc, getDoc, Firestore } = await import("firebase/firestore")
          const { db } = await import("@/lib/firebase") as { db: Firestore }
          
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)
          const userData = userDoc.data()
          
          // If user has no languages set, they need to complete onboarding
          if (userDoc.exists() && 
              (!userData.nativeLanguages || !userData.learningLanguages || 
               userData.nativeLanguages.length === 0 || userData.learningLanguages.length === 0)) {
            router.push("/onboarding")
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error)
        }
      }
      
      checkOnboardingStatus()
    }
  }, [user, loading, router])

  // If not authenticated, show landing page
  if (!user && !loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <div className="container flex flex-col items-center justify-center min-h-screen text-center z-10 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Connect and Learn With <span className="text-primary">Language Partners</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            Practice languages with native speakers from around the world. Join our community today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // If authenticated, show dashboard
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  )
}
