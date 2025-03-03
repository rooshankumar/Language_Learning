"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ChatList } from "@/components/chat/chat-list"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ChatInput } from "@/components/chat/chat-input"
import { AppShell } from "@/components/app-shell"

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

type Message = {
  id: string
  senderId: string
  text: string
  timestamp: any
}

export default function ChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch conversations
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageTime", "desc"),
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationsData: Conversation[] = []

      for (const doc of snapshot.docs) {
        const data = doc.data()
        const participantInfo: { [key: string]: any } = {}

        // Get participant info
        for (const participantId of data.participants) {
          if (participantId !== user.uid) {
            const userDoc = await getDoc(doc(db, "users", participantId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              participantInfo[participantId] = {
                displayName: userData.displayName,
                photoURL: userData.photoURL,
              }
            }
          }
        }

        conversationsData.push({
          id: doc.id,
          participants: data.participants,
          lastMessage: data.lastMessage || "",
          lastMessageTime: data.lastMessageTime,
          participantInfo,
        })
      }

      setConversations(conversationsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return

    const q = query(collection(db, `conversations/${selectedConversation}/messages`), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]

      setMessages(messagesData)
    })

    return () => unsubscribe()
  }, [selectedConversation])

  const sendMessage = async (text: string) => {
    if (!user || !selectedConversation || !text.trim()) return

    try {
      // Add message to conversation
      await addDoc(collection(db, `conversations/${selectedConversation}/messages`), {
        senderId: user.uid,
        text,
        timestamp: serverTimestamp(),
      })

      // Update conversation with last message
      await addDoc(
        doc(db, "conversations", selectedConversation),
        {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
        },
        { merge: true },
      )
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        <ChatList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          loading={loading}
        />
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              <ChatMessages
                messages={messages}
                currentUserId={user?.uid || ""}
                participants={conversations.find((c) => c.id === selectedConversation)?.participantInfo || {}}
              />
              <ChatInput onSendMessage={sendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <h3 className="text-lg font-medium">Select a conversation</h3>
                <p className="text-muted-foreground">Choose a conversation from the list or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ChatList } from "@/components/chat/chat-list"

export default function ChatPage() {
  return (
    <AppShell>
      <div className="container py-6">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Conversations</h1>
        <p className="text-muted-foreground mb-6">
          Chat with your language exchange partners
        </p>
        
        <div className="max-w-3xl mx-auto">
          <ChatList />
        </div>
      </div>
    </AppShell>
  )
}
