'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Firebase Auth errors during build
const ChatPage = dynamic(() => import('@/components/chat/chat-page'), {
  ssr: false,
  loading: () => <p>Loading chat...</p>
});

export default function Page() {
  return <ChatPage />;
}