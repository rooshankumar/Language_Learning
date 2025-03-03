"use client"

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { ChatWindow } from '@/components/chat/chat-window'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export default function ChatDetailPage({ params }: { params: { chatId: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [recipientId, setRecipientId] = useState<string | null>(null)

  useEffect(() => {
    // Get the chat data to determine the recipient
    const fetchChatData = async () => {
      if (!user) return

      try {
        const { doc, getDoc } = await import("firebase/firestore")
        const { db } = await import("@/lib/firebase")

        const chatDoc = await getDoc(doc(db, "chats", params.chatId))
        if (!chatDoc.exists()) {
          console.error("Chat not found")
          router.push("/chat")
          return
        }

        const chatData = chatDoc.data()
        // Find the other participant (not the current user)
        const otherParticipant = chatData.participants.find((id: string) => id !== user.uid)
        setRecipientId(otherParticipant)
      } catch (error) {
        console.error("Error fetching chat data:", error)
      }
    }

    if (user && !loading) {
      fetchChatData()
    }
  }, [params.chatId, user, loading, router])

  const handleBack = () => {
    router.push("/chat")
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <p>Loading chat...</p>
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <p>Please sign in to view this chat</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="h-full">
        {recipientId ? (
          <ChatWindow
            chatId={params.chatId}
            recipientId={recipientId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p>Loading conversation...</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}