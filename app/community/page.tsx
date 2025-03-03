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
        const usersCollection = collection(db, "users");
        let q;

        if (user && user.uid) {
          // If user is authenticated, exclude the current user
          q = query(usersCollection, where("uid", "!=", user.uid));
        } else {
          // If no user is authenticated, get all users
          q = query(usersCollection);
        }

        const querySnapshot = await getDocs(q);
        const usersData: UserData[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as any;

          // Format the data to match UserData type, with default values for missing fields
          const userData: UserData = {
            uid: data.uid || doc.id,
            displayName: data.name || data.displayName || "Anonymous User",
            photoURL: data.photoURL || "/placeholder-user.jpg",
            nativeLanguage: data.nativeLanguage || "Not specified",
            learningLanguage: data.learningLanguage || "Not specified",
            interests: data.interests || [],
            bio: data.bio || "No bio available"
          };

          usersData.push(userData);
        });

        console.log("Fetched users:", usersData.length);
        setUsers(usersData);
        setFilteredUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          description: "Failed to load community members.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, toast, db])

  useEffect(() => {
    if (users.length === 0) return

    let filtered = [...users]

    if (filters.language) {
      filtered = filtered.filter(
        user => (filters.language === "all" || user.nativeLanguage === filters.language || user.learningLanguage === filters.language)
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
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserCard } from "@/components/community/user-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { FilterIcon, Search, X } from "lucide-react"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

interface User {
  id: string
  name: string
  photoURL: string
  age?: number
  bio?: string
  nativeLanguage?: string
  learningLanguage?: string
  interests?: string[]
}

export default function CommunityPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [learningLanguage, setLearningLanguage] = useState<string>("")
  const [nativeLanguage, setNativeLanguage] = useState<string>("")
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 60])
  const [interests, setInterests] = useState<string[]>([])
  
  const { user } = useAuth()
  const router = useRouter()
  
  // Fetch users from Firestore
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        
        if (!db) {
          console.error("Firestore not initialized")
          setError("Service is not available right now")
          setLoading(false)
          return
        }
        
        const usersCollection = collection(db, "users")
        const usersQuery = query(
          usersCollection,
          orderBy("createdAt", "desc"),
          limit(50)
        )
        
        const snapshot = await getDocs(usersQuery)
        
        const usersData = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(u => u.id !== user?.uid) as User[]
        
        setUsers(usersData)
        setFilteredUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
        setError("Failed to load community members")
      } finally {
        setLoading(false)
      }
    }
    
    fetchUsers()
  }, [db, user?.uid])
  
  // Apply filters when filter states change
  useEffect(() => {
    let result = [...users]
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(user => 
        user.name?.toLowerCase().includes(term) || 
        user.bio?.toLowerCase().includes(term) ||
        user.interests?.some(interest => interest.toLowerCase().includes(term))
      )
    }
    
    // Apply language filters
    if (learningLanguage) {
      result = result.filter(user => 
        user.learningLanguage?.toLowerCase() === learningLanguage.toLowerCase()
      )
    }
    
    if (nativeLanguage) {
      result = result.filter(user => 
        user.nativeLanguage?.toLowerCase() === nativeLanguage.toLowerCase()
      )
    }
    
    // Apply age filter
    result = result.filter(user => 
      !user.age || (user.age >= ageRange[0] && user.age <= ageRange[1])
    )
    
    // Apply interests filter
    if (interests.length > 0) {
      result = result.filter(user => 
        interests.some(interest => 
          user.interests?.some(userInterest => 
            userInterest.toLowerCase().includes(interest.toLowerCase())
          )
        )
      )
    }
    
    setFilteredUsers(result)
  }, [users, searchTerm, learningLanguage, nativeLanguage, ageRange, interests])
  
  const handleMessageClick = (userId: string) => {
    router.push(`/chat/${userId}`)
  }
  
  const addInterest = (interest: string) => {
    if (interest && !interests.includes(interest)) {
      setInterests([...interests, interest])
    }
  }
  
  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }
  
  const clearFilters = () => {
    setSearchTerm("")
    setLearningLanguage("")
    setNativeLanguage("")
    setAgeRange([18, 60])
    setInterests([])
  }
  
  // Language options for dropdowns
  const languages = [
    { value: "english", label: "English" },
    { value: "spanish", label: "Spanish" },
    { value: "french", label: "French" },
    { value: "german", label: "German" },
    { value: "italian", label: "Italian" },
    { value: "portuguese", label: "Portuguese" },
    { value: "russian", label: "Russian" },
    { value: "japanese", label: "Japanese" },
    { value: "korean", label: "Korean" },
    { value: "chinese", label: "Chinese" },
    { value: "arabic", label: "Arabic" }
  ]
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-pink-800 dark:text-pink-400">Community</h1>
            <p className="text-gray-600 dark:text-gray-400">Connect with language learners around the world</p>
          </div>
          
          {/* Mobile Filter Button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="md:hidden flex items-center gap-2">
                <FilterIcon className="h-4 w-4" />
                Filters
                {(learningLanguage || nativeLanguage || interests.length > 0 || ageRange[0] !== 18 || ageRange[1] !== 60) && (
                  <Badge className="ml-1 bg-pink-600 text-white hover:bg-pink-600">
                    {[
                      learningLanguage && 1,
                      nativeLanguage && 1,
                      interests.length > 0 && 1,
                      (ageRange[0] !== 18 || ageRange[1] !== 60) && 1
                    ].filter(Boolean).length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filter Community</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {/* Mobile filters go here - same as desktop filters */}
                <div className="space-y-2">
                  <Label htmlFor="mobile-learning">Learning Language</Label>
                  <Select value={learningLanguage} onValueChange={setLearningLanguage}>
                    <SelectTrigger id="mobile-learning">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any language</SelectItem>
                      {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobile-native">Native Language</Label>
                  <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                    <SelectTrigger id="mobile-native">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any language</SelectItem>
                      {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Age Range: {ageRange[0]} - {ageRange[1]}</Label>
                  <Slider
                    value={ageRange}
                    min={18}
                    max={80}
                    step={1}
                    onValueChange={(value) => setAgeRange(value as [number, number])}
                    className="py-4"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mobile-interests">Interests</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mobile-interests"
                      placeholder="Add interest"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addInterest((e.target as HTMLInputElement).value)
                          ;(e.target as HTMLInputElement).value = ''
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={(e) => {
                        const input = document.getElementById('mobile-interests') as HTMLInputElement
                        addInterest(input.value)
                        input.value = ''
                      }}
                      className="bg-pink-600 hover:bg-pink-700"
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {interests.map(interest => (
                      <Badge 
                        key={interest} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {interest}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeInterest(interest)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={clearFilters} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  Clear Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="search"
              placeholder="Search community..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop Filters */}
          <div className="hidden md:block w-full md:w-64 space-y-6 bg-white/80 dark:bg-gray-800/80 p-4 rounded-lg backdrop-blur-sm">
            <h2 className="font-semibold text-lg">Filters</h2>
            
            <div className="space-y-2">
              <Label htmlFor="learning">Learning Language</Label>
              <Select value={learningLanguage} onValueChange={setLearningLanguage}>
                <SelectTrigger id="learning">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any language</SelectItem>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="native">Native Language</Label>
              <Select value={nativeLanguage} onValueChange={setNativeLanguage}>
                <SelectTrigger id="native">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any language</SelectItem>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Age Range: {ageRange[0]} - {ageRange[1]}</Label>
              <Slider
                value={ageRange}
                min={18}
                max={80}
                step={1}
                onValueChange={(value) => setAgeRange(value as [number, number])}
                className="py-4"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="desktop-interests">Interests</Label>
              <div className="flex gap-2">
                <Input
                  id="desktop-interests"
                  placeholder="Add interest"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addInterest((e.target as HTMLInputElement).value)
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={(e) => {
                    const input = document.getElementById('desktop-interests') as HTMLInputElement
                    addInterest(input.value)
                    input.value = ''
                  }}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  Add
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-2">
                {interests.map(interest => (
                  <Badge 
                    key={interest} 
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {interest}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={clearFilters} 
              variant="outline" 
              className="w-full mt-4"
            >
              Clear Filters
            </Button>
          </div>
          
          {/* Users Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="large" />
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <p className="text-red-500">{error}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64 text-center">
                <p className="text-gray-500 mb-4">No users match your filters</p>
                <Button onClick={clearFilters} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(user => (
                  <UserCard 
                    key={user.id}
                    id={user.id}
                    name={user.name || "Anonymous"}
                    photoURL={user.photoURL || "/placeholder-user.jpg"}
                    age={user.age}
                    bio={user.bio}
                    nativeLanguage={user.nativeLanguage}
                    learningLanguage={user.learningLanguage}
                    interests={user.interests}
                    onMessageClick={handleMessageClick}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
