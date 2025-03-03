
"use client"

import React from 'react'
import Image from 'next/image'
import { Card } from "@/components/ui/card"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { MessageSquare, Flag } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useAuth } from "@/contexts/auth-context"

interface UserCardProps {
  user: {
    id: string
    name: string
    photoURL?: string
    email?: string
    nativeLanguage?: string
    learningLanguages?: string[]
    interests?: string[]
    bio?: string
    age?: number
  }
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()
  const { startNewChat } = useChat()
  const { user: currentUser } = useAuth()
  
  const handleChatClick = async () => {
    if (!currentUser || !user.id) return
    
    try {
      const chatId = await startNewChat(user.id)
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error("Error starting chat:", error)
    }
  }

  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="relative h-32 w-full bg-gradient-to-r from-blue-400 to-purple-500">
          {/* Background pattern/image could go here */}
        </div>
        <div className="relative flex flex-col items-center px-4 -mt-12 pb-4">
          <div className="relative h-24 w-24 rounded-full border-4 border-background overflow-hidden mb-2">
            <Image
              src={user.photoURL || "/placeholder-user.jpg"}
              alt={user.name || "User"}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold mb-1">{user.name}</h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span>Native: {user.nativeLanguage || "Not specified"}</span>
          </div>
          
          {user.learningLanguages && user.learningLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-sm text-muted-foreground mr-1">Learning:</span>
              {user.learningLanguages.map((lang, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          )}
          
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-sm text-muted-foreground mr-1">Interests:</span>
              {user.interests.slice(0, 3).map((interest, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {interest}
                </Badge>
              ))}
              {user.interests.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{user.interests.length - 3} more
                </Badge>
              )}
            </div>
          )}
          
          {user.bio && (
            <p className="text-sm text-center text-muted-foreground line-clamp-3 mb-2">
              {user.bio}
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between gap-2 p-4 pt-0">
        <Button 
          variant="default" 
          size="sm" 
          className="w-full" 
          onClick={handleChatClick}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </Button>
        
        <Button variant="outline" size="sm" className="w-1/3">
          <Flag className="h-4 w-4" />
          <span className="sr-only">Report</span>
        </Button>
      </CardFooter>
    </Card>
  )
}
