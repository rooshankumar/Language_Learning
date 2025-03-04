"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import ChatDetailPage with SSR disabled
const ChatDetailPage = dynamic(() => import("@/components/chat/chat-detail-page"), {
  ssr: false,
  loading: () => <div className="p-4">Loading chat conversation...</div>,
})

export default function Page({ params }: any) {
  if (!params || !params.chatId) {
    return <div className="p-4">Invalid chat ID</div>
  }

  console.log("Params received:", params) // Debugging log

  return (
    <Suspense fallback={<div className="p-4">Loading chat conversation...</div>}>
      <ChatDetailPage chatId={params.chatId} />
    </Suspense>
  )
}
