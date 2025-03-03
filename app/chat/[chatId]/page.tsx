
"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Use dynamic import with no SSR to prevent Firebase Auth errors during build
const ChatDetailPage = dynamic(() => import('@/components/chat/chat-detail-page'), {
  ssr: false,
  loading: () => <div className="p-4">Loading chat conversation...</div>,
})

export default function Page({ params }: { params: { chatId: string } }) {
  return (
    <Suspense fallback={<div className="p-4">Loading chat conversation...</div>}>
      <ChatDetailPage chatId={params.chatId} />
    </Suspense>
  )
}
