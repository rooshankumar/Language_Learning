
"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Star, User } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { collection, addDoc, serverTimestamp, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

// Define the user data shape
interface UserData {
  uid: string
  displayName?: string
  photoURL?: string
  nativeLanguage?: string
  learningLanguage?: string
  interests?: string[]
  bio?: string
  level?: string
}

// UserCard Component
export function UserCard({ user }: { user: UserData }) {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const { toast } = useToast()

  const handleStartConversation = async () => {
    if (!currentUser) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to start a conversation",
        variant: "destructive"
      })
      router.push("/sign-in")
      return
    }

    try {
      // Check if conversation already exists
      const conversationsRef = collection(db, "conversations")
      const q = query(
        conversationsRef, 
        where("participants", "array-contains", currentUser.uid),
      )
      
      const querySnapshot = await getDocs(q)
      let conversationExists = false
      let existingConversationId = ""
      
      querySnapshot.forEach((doc) => {
        const conversation = doc.data()
        if (conversation.participants.includes(user.uid)) {
          conversationExists = true
          existingConversationId = doc.id
        }
      })
      
      if (conversationExists) {
        router.push(`/chat/${existingConversationId}`)
        return
      }
      
      // Create new conversation
      const newConversationRef = await addDoc(collection(db, "conversations"), {
        participants: [currentUser.uid, user.uid],
        createdAt: serverTimestamp(),
        lastMessage: null,
        lastMessageTime: serverTimestamp()
      })
      
      router.push(`/chat/${newConversationRef.id}`)
      
      toast({
        title: "Conversation started",
        description: `You can now chat with ${user.displayName || "this user"}`
      })
    } catch (error) {
      console.error("Error starting conversation:", error)
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      })
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
        <Button size="sm" className="w-full" onClick={handleStartConversation}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Start Chat
        </Button>
      </CardFooter>
    </Card>
  )
}
