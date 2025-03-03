
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell } from '@/components/app-shell';

export default function ChatPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Initialize any chat data loading here
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div>Loading chat data...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Chat</h1>
        {user ? (
          <div>
            <p>Welcome to the chat, {user.displayName || 'User'}!</p>
            {/* Your chat content here */}
          </div>
        ) : (
          <div>
            <p>Please sign in to access the chat features.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
