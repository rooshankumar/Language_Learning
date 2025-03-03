"use client"

import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { ChatList } from "@/components/chat/chat-list"
import { ChatWindow } from "@/components/chat/chat-window"
import { useAuth } from "@/contexts/auth-context"

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null)
  const { user } = useAuth()

  const handleChatSelect = (chatId: string, recipientId: string) => {
    setSelectedChatId(chatId)
    setSelectedRecipientId(recipientId)
  }

  const handleBackToList = () => {
    setSelectedChatId(null)
    setSelectedRecipientId(null)
  }

  if (!user) {
    return <div>Please sign in to access your messages</div>
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
        <div className={`lg:col-span-1 border-r ${selectedChatId ? 'hidden lg:block' : 'block'}`}>
          <ChatList onChatSelect={handleChatSelect} />
        </div>
        <div className={`lg:col-span-2 ${selectedChatId ? 'block' : 'hidden lg:flex lg:items-center lg:justify-center'}`}>
          {selectedChatId && selectedRecipientId ? (
            <ChatWindow 
              chatId={selectedChatId} 
              recipientId={selectedRecipientId} 
              onBack={handleBackToList}
            />
          ) : (
            <div className="text-center p-8">
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a chat from the list to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}