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
  const chatId = params.id as string
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

    const messagesRef = collection(db, "chats", chatId, "messages")
    const messagesQuery = query(messagesRef, orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages: Message[] = snapshot.docs.map(doc => ({
        id: doc.id,
        senderId: doc.data().senderId,
        text: doc.data().text,
        timestamp: doc.data().timestamp
      }))

      setMessages(newMessages)
      setLoading(false)
    }, (error) => {
      console.error("Error getting messages:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [db, user, chatId])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || !db || !user || !chatId) return

    try {
      // Add the message to Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        text: message,
        timestamp: serverTimestamp()
      })

      // Clear the input
      setMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Please sign in to use the chat</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex flex-col h-[calc(100vh-80px)]">
      {/* Chat Header */}
      <div className="flex items-center border-b p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <Link href="/community" className="mr-2">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        {chatPartner ? (
          <div className="flex items-center">
            <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
              <Image
                src={chatPartner.photoURL || "/placeholder-user.jpg"}
                alt={chatPartner.name}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="font-medium">{chatPartner.name}</h2>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
            <div>
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-3 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
            </div>
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-800/50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-center">
            <p className="text-gray-500 mb-2">No messages yet</p>
            <p className="text-gray-400 text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === user.uid ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`px-4 py-2 max-w-[80%] break-words ${
                    msg.senderId === user.uid
                      ? "bg-pink-600 text-white"
                      : "bg-white dark:bg-gray-700"
                  }`}
                >
                  {msg.text}
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="border-t p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!message.trim()}
            className="bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}