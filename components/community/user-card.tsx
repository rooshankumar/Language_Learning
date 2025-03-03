"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { createChatId, startChat } from '@/lib/chat-service'
import { useToast } from '@/hooks/use-toast'

interface UserCardProps {
  user: any
}

export function UserCard({ user }: UserCardProps) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)

  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault()

    if (!currentUser) {
      toast({
        title: "Please sign in",
        description: "You need to sign in to start a conversation",
        variant: "destructive"
      })
      router.push('/sign-in')
      return
    }

    if (user.uid === currentUser.uid) {
      toast({
        description: "You cannot chat with yourself",
      })
      return
    }

    try {
      setLoading(true)

      // Initialize or get the chat in Firestore
      const chatId = await startChat(
        currentUser.uid, 
        currentUser.displayName || 'User', 
        user.uid
      )

      // Navigate to the chat
      router.push(`/chat/${chatId}?userId=${user.uid}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.photoURL || ""} alt={user.displayName || "User"} />
            <AvatarFallback>{user.displayName?.substring(0, 2) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">{user.displayName}</CardTitle>
            <CardDescription className="text-xs">
              {user.level || "Beginner"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            {user.nativeLanguage || "Native"}
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            {user.learningLanguage || "Learning"}
          </Badge>
        </div>
        <div className="text-sm line-clamp-3 text-muted-foreground min-h-[3em]">
          {user.bio || "No bio provided."}
        </div>
      </CardContent>
      <CardFooter className="pt-1">
        <Button 
          size="sm" 
          className="w-full"
          onClick={handleStartConversation}
          disabled={loading}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {loading ? "Starting..." : "Start Chat"}
        </Button>
      </CardFooter>
    </Card>
  )
}