
"use client"

import React from 'react'

"use client"

import { CardContent, CardFooter } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, UserPlus, MessageSquare, Loader2 } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"


type UserData = {
  uid: string
  displayName: string
  photoURL: string
  nativeLanguage: string
  learningLanguage: string
  interests: string[]
  bio: string
}

interface DetailedUserCardProps {
  user: UserData
  onStartConversation: () => void
}

export function DetailedUserCard({ user, onStartConversation }: DetailedUserCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="h-24 bg-gradient-to-r from-primary to-purple-400"></div>
      <CardContent className="p-6 pt-0 -mt-12">
        <Avatar className="h-24 w-24 border-4 border-background">
          <AvatarImage src={user.photoURL || ""} alt={user.displayName} />
          <AvatarFallback className="text-2xl">{user.displayName?.substring(0, 2) || "??"}</AvatarFallback>
        </Avatar>
        <h3 className="text-xl font-bold mt-4">{user.displayName}</h3>

        <div className="flex gap-2 mt-2">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            {user.nativeLanguage}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            {user.learningLanguage}
          </Badge>
        </div>

        <p className="text-muted-foreground mt-3 line-clamp-3">{user.bio || "No bio provided"}</p>

        {user.interests && user.interests.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Interests</p>
            <div className="flex flex-wrap gap-1">
              {user.interests.slice(0, 5).map((interest) => (
                <Badge key={interest} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {user.interests.length > 5 && (
                <Badge variant="secondary" className="text-xs">
                  +{user.interests.length - 5} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 p-6 pt-0">
        <Button className="flex-1" onClick={onStartConversation}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Message
        </Button>
        <Button variant="outline" className="flex-1">
          <UserPlus className="mr-2 h-4 w-4" />
          Connect
        </Button>
      </CardFooter>
    </Card>
  )
}

interface UserCardProps {
  user: UserData
}

export function UserCard({ user }: UserCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Function to start a chat with this user
  const startChat = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start a chat.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Check if a conversation already exists between these users
      const conversationsRef = collection(db, "conversations")
      const q = query(
        conversationsRef,
        where("participants", "array-contains", currentUser.uid)
      )

      const querySnapshot = await getDocs(q)
      let existingConversationId = null

      querySnapshot.forEach((doc) => {
        const convoData = doc.data()
        if (convoData.participants.includes(user.uid)) {
          existingConversationId = doc.id
        }
      })

      // If conversation exists, navigate to it
      if (existingConversationId) {
        router.push(`/chat/${existingConversationId}`)
        return
      }

      // Create a new conversation
      const newConversation = await addDoc(conversationsRef, {
        participants: [currentUser.uid, user.uid],
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        lastMessage: "",
        participantInfo: {
          [currentUser.uid]: {
            displayName: currentUser.displayName || "You",
            photoURL: currentUser.photoURL || "/placeholder-user.jpg",
          },
          [user.uid]: {
            displayName: user.displayName,
            photoURL: user.photoURL || "/placeholder-user.jpg",
          }
        }
      })

      // Navigate to the new chat
      router.push(`/chat/${newConversation.id}`)

      toast({
        title: "Chat started",
        description: `You can now chat with ${user.displayName}.`,
      })
    } catch (error) {
      console.error("Error starting chat:", error)
      toast({
        title: "Error",
        description: "Failed to start chat. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-video bg-muted w-full relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={user.photoURL} alt={user.displayName} />
            <AvatarFallback>{user.displayName?.substring(0, 2) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <CardContent className="grid gap-2.5 p-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-xl">{user.displayName}</h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="px-1 py-0">
              Speaks: {user.nativeLanguage || "Not specified"}
            </Badge>
            <Badge variant="default" className="px-1 py-0">
              Learning: {user.learningLanguage || "Not specified"}
            </Badge>
          </div>
        </div>
        <div className="line-clamp-3 text-sm text-muted-foreground">
          {user.bio || "No bio available."}
        </div>
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {user.interests.slice(0, 3).map((interest) => (
              <Badge key={interest} variant="outline" className="px-1 py-0">
                {interest}
              </Badge>
            ))}
            {user.interests.length > 3 && (
              <Badge variant="outline" className="px-1 py-0">
                +{user.interests.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full" 
          size="sm" 
          onClick={startChat}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MessageCircle className="mr-2 h-4 w-4" />
          )}
          Start Chat
        </Button>
      </CardFooter>
    </Card>
  )
}
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"

interface UserCardProps {
  id: string
  name: string
  photoURL: string
  age?: number
  bio?: string
  nativeLanguage?: string
  learningLanguage?: string
  interests?: string[]
  onMessageClick?: (userId: string) => void
}

export function UserCard({
  id,
  name,
  photoURL,
  age,
  bio,
  nativeLanguage,
  learningLanguage,
  interests = [],
  onMessageClick
}: UserCardProps) {
  return (
    <Card className="overflow-hidden h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-pink-500/20">
      <CardHeader className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-pink-500">
            <Image 
              src={photoURL || "/placeholder-user.jpg"} 
              alt={name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription className="flex gap-2 items-center">
              {age && <span>{age} years</span>}
              {nativeLanguage && (
                <Badge variant="outline" className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 border-pink-300 dark:border-pink-700">
                  {nativeLanguage} (native)
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {bio && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{bio}</p>
          </div>
        )}
        
        {learningLanguage && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Learning</p>
            <Badge className="bg-pink-600 text-white hover:bg-pink-700">{learningLanguage}</Badge>
          </div>
        )}
        
        {interests && interests.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Interests</p>
            <div className="flex flex-wrap gap-1">
              {interests.slice(0, 3).map((interest, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {interests.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{interests.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          asChild
        >
          <Link href={`/profile/${id}`}>View Profile</Link>
        </Button>
        <Button
          size="sm"
          className="bg-pink-600 hover:bg-pink-700 text-white"
          onClick={() => onMessageClick && onMessageClick(id)}
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Message
        </Button>
      </CardFooter>
    </Card>
  )
}
