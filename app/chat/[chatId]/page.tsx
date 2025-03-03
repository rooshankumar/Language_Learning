"use client"

import { useEffect, useState } from 'react';
import { getAuth } from "firebase/auth";

export default function ChatPage({ params }: { params: { chatId: string } }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run this on the client-side
    if (typeof window !== 'undefined') {
      const auth = getAuth();
      const unsubscribe = auth.onAuthStateChanged(user => {
        setUser(user);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  if (isLoading) {
    return <p>Loading...</p>
  }

  if (user) {
    return <p>Chat ID: {params.chatId}</p>
  }
  else {
    return <p>User is not logged in.</p>
  }
}