"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type Conversation = {
  id: string
  participants: string[]
  lastMessage: string
  lastMessageTime: any
  participantInfo: {
    [key: string]: {
      displayName: string
      photoURL: string
    }
  }
}

interface ChatListProps {
  conversations: Conversation[]
  selectedConversation: string | null
  onSelectConversation: (id: string) => void
  loading: boolean
}

export function ChatList({ conversations, selectedConversation, onSelectConversation, loading }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipantId = conversation.participants.find((id) => id !== "current-user-id")
    if (!otherParticipantId) return false

    const participantName = conversation.participantInfo[otherParticipantId]?.displayName || ""
    return participantName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="w-80 border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="icon" variant="ghost">
            <Plus className="h-5 w-5" />
            <span className="sr-only">New conversation</span>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No conversations found</div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => {
              const otherParticipantId = conversation.participants.find((id) => id !== "current-user-id")
              if (!otherParticipantId) return null

              const participant = conversation.participantInfo[otherParticipantId]

              return (
                <button
                  key={conversation.id}
                  className={`w-full p-4 flex items-start gap-3 hover:bg-muted/50 text-left ${
                    selectedConversation === conversation.id ? "bg-muted" : ""
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <Avatar>
                    <AvatarImage src={participant?.photoURL || ""} alt={participant?.displayName || ""} />
                    <AvatarFallback>{participant?.displayName?.substring(0, 2) || "??"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{participant?.displayName}</p>
                      {conversation.lastMessageTime && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.lastMessageTime.toDate()), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Search, X } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { getUserChats } from '@/lib/chat-service'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'

interface ChatSummary {
  id: string
  lastMessage: string
  lastMessageTimestamp: string
  otherUser: {
    id: string
    name: string
    photoURL: string | null
  }
  unreadCount: number
}

export function ChatList() {
  const { user } = useAuth()
  const router = useRouter()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [filteredChats, setFilteredChats] = useState<ChatSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    async function fetchChats() {
      try {
        const userChats = await getUserChats(user.uid)
        setChats(userChats)
        setFilteredChats(userChats)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching chats:', error)
        setLoading(false)
      }
    }

    fetchChats()
  }, [user])

  // Filter chats based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(chats)
      return
    }

    const filtered = chats.filter(chat => 
      chat.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredChats(filtered)
  }, [searchQuery, chats])

  const handleChatSelect = (chatId: string, otherUserId: string) => {
    router.push(`/chat/${chatId}?userId=${otherUserId}`)
  }

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return ''
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p>Please sign in to view your conversations</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Search conversations..." 
          className="pl-10"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2" 
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ) : filteredChats.length > 0 ? (
        <div className="space-y-3">
          {filteredChats.map(chat => (
            <div 
              key={chat.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleChatSelect(chat.id, chat.otherUser.id)}
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={chat.otherUser.photoURL || ''} />
                  <AvatarFallback>{chat.otherUser.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center gap-2">
                    {chat.otherUser.name}
                    {chat.unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {chat.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {chat.lastMessage || 'Start a conversation...'}
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatTimestamp(chat.lastMessageTimestamp)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-1">No conversations yet</h3>
          <p className="text-muted-foreground mb-4">
            Visit the community section to find language partners
          </p>
          <Button onClick={() => router.push('/community')}>
            Find Language Partners
          </Button>
        </div>
      )}
    </div>
  )
}
