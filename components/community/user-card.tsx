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

interface UserCardProps {
  user: UserData
  onStartConversation?: (userId: string) => void
}

export function UserCard({ user, onStartConversation }: UserCardProps) {
  const handleStartConversation = () => {
    if (onStartConversation) {
      onStartConversation(user.uid)
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

        <div className="flex gap-2 mt-4">
          <Button onClick={onStartConversation} className="flex-1">
            <MessageCircle className="mr-2 h-4 w-4" />
            Start Chat
          </Button>
          <Button variant="outline" className="flex-1">
            <User className="mr-2 h-4 w-4" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}