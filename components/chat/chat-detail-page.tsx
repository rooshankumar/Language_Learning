
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { sendMessage, getChatMessages, markMessagesAsRead } from "@/lib/chat-service";
import { db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot, collection } from "firebase/firestore";
import { format } from "date-fns";
import { Send } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: any;
  read: boolean;
}

interface ChatPartner {
  id: string;
  displayName: string;
  photoURL: string;
}

export default function ChatDetailPage({ chatId }: { chatId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatPartner, setChatPartner] = useState<ChatPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user || !chatId) return;

    const fetchInitialData = async () => {
      try {
        // Get all messages for this chat
        const chatMessages = await getChatMessages(chatId);
        setMessages(chatMessages as Message[]);

        // Mark messages as read
        await markMessagesAsRead(user.uid, chatId);

        // Get chat document to find the other participant
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find(
            (id: string) => id !== user.uid
          );

          // Get other user's details
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setChatPartner({
              id: otherUserId,
              displayName: userData.displayName || "User",
              photoURL: userData.photoURL || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching chat data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();

    // Set up real-time listener for new messages
    const unsubscribe = onSnapshot(
      collection(db, "chats", chatId, "messages"),
      (snapshot) => {
        const newMessages: Message[] = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() } as Message);
        });

        // Sort by timestamp
        newMessages.sort((a, b) => {
          const dateA = new Date(a.timestamp || 0);
          const dateB = new Date(b.timestamp || 0);
          return dateA.getTime() - dateB.getTime();
        });

        setMessages(newMessages);

        // Mark messages as read when received
        if (user && newMessages.some(m => m.recipientId === user.uid && !m.read)) {
          markMessagesAsRead(user.uid, chatId);
        }
      }
    );

    return () => unsubscribe();
  }, [chatId, user]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !chatPartner || !newMessage.trim()) return;

    try {
      await sendMessage(
        user.uid,
        user.displayName || "User",
        chatPartner.id,
        newMessage.trim()
      );
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          Loading chat...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Card className="flex flex-col h-[calc(100vh-130px)] border-0 shadow-none">
        <CardHeader className="border-b px-4 py-3">
          {chatPartner ? (
            <div className="flex items-center">
              <Avatar className="h-9 w-9 mr-2">
                <AvatarImage src={chatPartner.photoURL} alt={chatPartner.displayName} />
                <AvatarFallback>
                  {chatPartner.displayName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="text-lg font-medium">
                {chatPartner.displayName}
              </CardTitle>
            </div>
          ) : (
            <CardTitle>Chat</CardTitle>
          )}
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.senderId === user?.uid;
              const messageDate = new Date(message.timestamp);
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 
                      ${isCurrentUser 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"}
                    `}
                  >
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1 text-right">
                      {format(messageDate, "HH:mm")}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="border-t p-3">
          <form onSubmit={handleSendMessage} className="flex w-full gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </AppShell>
  );
}

"use client"

import { useEffect, useState } from 'react'
import { AppShell } from '@/components/app-shell'
import { ChatWindow } from '@/components/chat/chat-window'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export default function ChatDetailPage({ chatId }: { chatId: string }) {
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

        const chatDoc = await getDoc(doc(db, "chats", chatId))
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
  }, [chatId, user, loading, router])

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
            chatId={chatId}
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