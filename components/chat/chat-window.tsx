
"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendHorizontal, ArrowLeft, FileIcon, ImageIcon, Info } from "lucide-react"
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { getChatMessages, markMessagesAsRead, sendMessage as sendFirestoreMessage } from '@/lib/chat-service'
import { useChat } from '@/hooks/use-chat'
import { formatDistanceToNow } from 'date-fns'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Skeleton } from '../ui/skeleton'

interface Message {
  id?: string
  senderId: string
  senderName?: string
  recipientId: string
  content: string
  timestamp: string
  read: boolean
}

interface ChatWindowProps {
  chatId: string
  recipientId: string
  onBack?: () => void
}

export function ChatWindow({ chatId, recipientId, onBack }: ChatWindowProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [recipient, setRecipient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastMessageTimestampRef = useRef<string | null>(null)
  
  // Get Socket.io connection from hook
  const { 
    connected,
    sendMessage: sendSocketMessage,
    markAsRead,
    setTyping,
    isUserTyping
  } = useChat()

  // Fetch recipient details and message history
  useEffect(() => {
    if (!user) return
    
    async function fetchData() {
      try {
        // Fetch recipient details
        const recipientDoc = await getDoc(doc(db, 'users', recipientId))
        
        if (recipientDoc.exists()) {
          setRecipient(recipientDoc.data())
        } else {
          toast({
            title: "User not found",
            description: "The user may have deleted their account",
            variant: "destructive"
          })
        }
        
        // Fetch message history
        const chatMessages = await getChatMessages(chatId)
        setMessages(chatMessages as Message[])
        
        // Mark messages as read
        await markMessagesAsRead(user.uid, chatId)
        markAsRead(chatId)
        
        // Track last message timestamp for new message detection
        if (chatMessages.length > 0) {
          const latestMessage = chatMessages[chatMessages.length - 1] as Message
          lastMessageTimestampRef.current = latestMessage.timestamp
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error fetching chat data:', error)
        toast({
          title: "Error loading chat",
          description: "Could not load the conversation",
          variant: "destructive"
        })
        setLoading(false)
      }
    }
    
    fetchData()
  }, [user, recipientId, chatId, toast, markAsRead])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for new messages via Socket.io and merge with Firestore messages
  useEffect(() => {
    // Only merge messages if we have loaded initial history
    if (loading) return
    
    async function refreshMessages() {
      try {
        const newMessages = await getChatMessages(chatId) as Message[]
        
        // Find newest timestamp
        let newestTimestamp = lastMessageTimestampRef.current
        
        for (const msg of newMessages) {
          if (!newestTimestamp || new Date(msg.timestamp) > new Date(newestTimestamp)) {
            newestTimestamp = msg.timestamp
          }
        }
        
        if (newestTimestamp !== lastMessageTimestampRef.current) {
          // Update messages and last timestamp
          setMessages(newMessages)
          lastMessageTimestampRef.current = newestTimestamp
          
          // Mark new messages as read
          if (user) {
            await markMessagesAsRead(user.uid, chatId)
            markAsRead(chatId)
          }
        }
      } catch (error) {
        console.error('Error refreshing messages:', error)
      }
    }
    
    // Set up interval to check for new messages
    const intervalId = setInterval(refreshMessages, 5000)
    
    return () => clearInterval(intervalId)
  }, [loading, chatId, user, markAsRead])

  // Handle form submission
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!newMessage.trim() || !user) return
    
    try {
      const content = newMessage.trim()
      setNewMessage('')
      
      // Add optimistic message
      const optimisticMessage: Message = {
        senderId: user.uid,
        senderName: user.displayName || 'You',
        recipientId,
        content,
        timestamp: new Date().toISOString(),
        read: false
      }
      
      setMessages(prev => [...prev, optimisticMessage])
      
      // Clear typing indicator
      setTyping(recipientId, false)
      
      // Send via socket for real-time delivery
      if (connected) {
        sendSocketMessage(recipientId, content, chatId)
      } else {
        // Fallback to Firestore only if socket is not connected
        await sendFirestoreMessage(
          user.uid,
          user.displayName || 'User',
          recipientId,
          content
        )
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  // Handle typing indication
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    // Send typing indicator if content is not empty
    setTyping(recipientId, e.target.value.length > 0)
  }

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  if (!user) {
    router.push('/sign-in')
    return null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      {/* Chat header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          ) : (
            <>
              <Avatar>
                <AvatarImage src={recipient?.photoURL || ''} />
                <AvatarFallback>
                  {recipient?.name?.substring(0, 2) || recipient?.displayName?.substring(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">
                  {recipient?.name || recipient?.displayName || 'User'}
                </h3>
                {isUserTyping[recipientId] && (
                  <p className="text-xs text-primary animate-pulse">Typing...</p>
                )}
              </div>
            </>
          )}
        </div>
        
        <Button variant="ghost" size="icon" onClick={() => router.push(`/profile/${recipientId}`)}>
          <Info className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${i % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Skeleton className={`h-4 w-40 ${i % 2 === 0 ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'}`} />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.senderId === user?.uid
              
              return (
                <div key={message.id || index} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p>{message.content}</p>
                    <div className={`text-xs mt-1 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <span className={isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}>
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="font-medium text-lg mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-4">Send a message to begin chatting</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="flex-shrink-0">
            <FileIcon className="h-5 w-5" />
          </Button>
          <Input 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={handleTyping}
            className="flex-1"
          />
          <Button type="submit" size="icon" className="flex-shrink-0" disabled={!newMessage.trim()}>
            <SendHorizontal className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'
import { useChat } from '@/hooks/use-chat'
import { ArrowLeft, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChatWindowProps {
  chatId: string
  recipientId: string
  onBack: () => void
}

export function ChatWindow({ chatId, recipientId, onBack }: ChatWindowProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientAvatar, setRecipientAvatar] = useState('')
  const { messages, sendMessage, loading } = useChat(chatId, recipientId)

  useEffect(() => {
    // Fetch recipient details
    const fetchRecipientDetails = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")
        
        const userDoc = await getDoc(doc(db, "users", recipientId))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setRecipientName(userData.displayName || 'User')
          setRecipientAvatar(userData.photoURL || '')
        }
      } catch (error) {
        console.error("Error fetching recipient details:", error)
      }
    }
    
    fetchRecipientDetails()
  }, [recipientId])

  const handleSend = () => {
    if (message.trim() && user) {
      sendMessage({
        senderId: user.uid,
        recipientId: recipientId,
        content: message.trim(),
        timestamp: new Date().toISOString(),
        read: false,
      })
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
          <ArrowLeft size={20} />
        </Button>
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={recipientAvatar || '/placeholder-user.jpg'} alt={recipientName} />
          <AvatarFallback>{recipientName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{recipientName}</span>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No messages yet. Start a conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.senderId === user?.uid
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    msg.senderId === user?.uid ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
