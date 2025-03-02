
"use client"

import { useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // This is handled by middleware, but as a fallback
  useEffect(() => {
    if (!loading && !user) {
      // User is not logged in, redirect to sign-in
      console.log("User not authenticated, redirecting to sign-in")
      router.push("/sign-in")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  // Don't render the children until we know the user is authenticated
  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col w-full">
        <MobileNav />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
