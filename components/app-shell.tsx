"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { TrustDeviceDialog } from "@/components/trust-device-dialog"; // Added import

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in")
    } else if (user && !localStorage.getItem("trust_device_dialog_shown")) {
      setShowDialog(true);
    }
  }, [user, loading, router])

  const handleTrustDevice = (trustDevice: boolean) => {
    if (trustDevice) {
      localStorage.setItem("trust_device_dialog_shown", "true");
    }
    setShowDialog(false);
  };


  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col"> {/* Modified structure */}
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <MobileNav />
      </header>
      <div className="flex flex-1">
        <AppSidebar />
        <main className="flex w-full flex-1 flex-col">
          {children}
        </main>
      </div>
      {showDialog && <TrustDeviceDialog onConfirm={handleTrustDevice} />} {/* Added dialog */}
    </div>
  )
}