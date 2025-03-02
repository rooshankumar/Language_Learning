"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AppShell } from "@/components/app-shell"
import { UserCard } from "@/components/community/user-card"
import { UserFilters } from "@/components/community/user-filters"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

type UserData = {
  uid: string
  displayName: string
  photoURL: string
  nativeLanguage: string
  learningLanguage: string
  interests: string[]
  bio: string
}

export default function CommunityPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    language: "",
    interests: [] as string[],
  })

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return

      try {
        const q = query(collection(db, "users"), where("uid", "!=", user.uid))

        const querySnapshot = await getDocs(q)
        const usersData: UserData[] = []

        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserData
          usersData.push(data)
        })

        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Failed to load community members.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [user, toast])

  useEffect(() => {
    if (users.length === 0) return

    let filtered = [...users]

    if (filters.language) {
      filtered = filtered.filter(
        user => user.nativeLanguage === filters.language || user.learningLanguage === filters.language
      )
    }

    if (filters.interests.length > 0) {
      filtered = filtered.filter(
        user => user.interests.some(interest => filters.interests.includes(interest))
      )
    }

    setFilteredUsers(filtered)
  }, [users, filters])

  return (
    <AppShell>
      <div className="container py-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Community</h1>
            <p className="text-muted-foreground">
              Find language exchange partners that match your interests
            </p>
          </div>
        </div>

        <UserFilters 
          onFilterChange={(newFilters) => setFilters(newFilters)} 
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((userData) => (
              <UserCard 
                key={userData.uid}
                user={userData}
              />
            ))}

            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No users found matching your filters</p>
                <Button 
                  variant="link" 
                  onClick={() => setFilters({ language: "", interests: [] })}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}