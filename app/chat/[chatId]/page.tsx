
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { ChatWindow } from "@/components/chat/chat-window"
import { ChatList } from "@/components/chat/chat-list"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ChatRoomPage({ params }: { params: { chatId: string } }) {
  const { chatId } = params
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId') || ""
  const router = useRouter()
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [showChatList, setShowChatList] = useState(true)
  
  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      // On mobile, when a chat is active, hide the list
      if (window.innerWidth < 1024 && chatId) {
        setShowChatList(false)
      } else {
        setShowChatList(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [chatId])
  
  // Handle "Back to conversations" action on mobile
  const handleBackToList = () => {
    if (isMobile) {
      setShowChatList(true)
    } else {
      router.push('/chat')
    }
  }
  
  if (!user) {
    router.push('/sign-in')
    return null
  }
  
  return (
    <AppShell>
      <div className="container h-full py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6 h-[calc(100vh-10rem)]">
          {/* Chat list - on mobile this is toggled */}
          {(showChatList || !isMobile) && (
            <div className={`lg:col-span-1 ${isMobile && chatId ? 'hidden' : 'block'}`}>
              <div className="flex items-center mb-4">
                <h1 className="text-2xl font-bold">Conversations</h1>
              </div>
              <ChatList />
            </div>
          )}
          
          {/* Chat window */}
          {chatId && userId && (
            <div className={`lg:col-span-2 ${isMobile && showChatList ? 'hidden' : 'block'}`}>
              <ChatWindow 
                chatId={chatId} 
                recipientId={userId}
                onBack={handleBackToList}
              />
            </div>
          )}
          
          {/* Empty state when no chat selected on desktop */}
          {!chatId && !isMobile && (
            <div className="lg:col-span-2 flex items-center justify-center h-full bg-muted/20 rounded-lg">
              <div className="text-center">
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list or start a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
