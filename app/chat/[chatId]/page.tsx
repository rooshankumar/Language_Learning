
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Send, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Message {
  id: string
  senderId: string
  text: string
  timestamp: any
}

interface ChatPartner {
  id: string
  name: string
  photoURL?: string
}

export default function ChatPage() {
  const params = useParams()
  const chatId = params.chatId as string
  const { user } = useAuth()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter();


  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch chat partner details
  useEffect(() => {
    const fetchChatPartner = async () => {
      if (!db) return

      try {
        const userDoc = await getDoc(doc(db, "users", chatId))

        if (userDoc.exists()) {
          setChatPartner({
            id: userDoc.id,
            name: userDoc.data().name || "User",
            photoURL: userDoc.data().photoURL
          })
        } else {
          //Handle case where chat partner doesn't exist.  Could redirect or show error.
          router.push('/community');
        }
      } catch (error) {
        console.error("Error fetching chat partner:", error)
      }
    }

    fetchChatPartner()
  }, [chatId, db, router])

  // Set up real-time messages listener
  useEffect(() => {
    if (!db || !user || !chatId) return

    setLoading(true)
    
    // Create a unique chat ID that is the same regardless of who started the chat
    const combinedId = user.uid < chatId ? 
      `${user.uid}_${chatId}` : 
      `${chatId}_${user.uid}`
    
    const messagesRef = collection(db, "chats", combinedId, "messages")
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"))
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList: Message[] = []
      snapshot.forEach((doc) => {
        messageList.push({
          id: doc.id,
          senderId: doc.data().senderId,
          text: doc.data().text,
          timestamp: doc.data().timestamp
        })
      })
      setMessages(messageList)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [user, chatId, db])
  
  const sendMessage = async () => {
    if (!message.trim() || !user || !chatId || !db) return
    
    try {
      // Create a unique chat ID that is the same regardless of who started the chat
      const combinedId = user.uid < chatId ? 
        `${user.uid}_${chatId}` : 
        `${chatId}_${user.uid}`
      
      // Add message to Firestore
      await addDoc(collection(db, "chats", combinedId, "messages"), {
        text: message,
        senderId: user.uid,
        timestamp: serverTimestamp()
      })
      
      // Update latest message in chats collection
      await updateDoc(doc(db, "chats", combinedId), {
        lastMessage: message,
        lastMessageTimestamp: serverTimestamp()
      })
      
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="mr-1">
          <Link href="/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        
        {chatPartner ? (
          <>
            {chatPartner.photoURL ? (
              <Image
                src={chatPartner.photoURL}
                alt={chatPartner.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {chatPartner.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="font-semibold">{chatPartner.name}</h2>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
              <div className="h-3 w-16 bg-muted animate-pulse rounded"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <Card className="p-6 mx-auto max-w-md">
              <h3 className="font-medium text-lg mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Send a message to begin chatting with {chatPartner?.name || 'your language partner'}
              </p>
            </Card>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.senderId === user?.uid 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                {msg.text}
                <div 
                  className={`text-xs mt-1 ${
                    msg.senderId === user?.uid 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {msg.timestamp?.toDate 
                    ? new Date(msg.timestamp.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                    : ''}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
