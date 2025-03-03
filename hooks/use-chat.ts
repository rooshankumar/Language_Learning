
import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket, io } from 'socket.io-client';
import { useAuth } from '@/contexts/auth-context';

// Define message type
export interface Message {
  id?: string;
  senderId: string;
  senderName?: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  chatId?: string;
}

// Define chat hook return type
interface UseChatReturn {
  messages: Message[];
  sendMessage: (message: Message) => void;
  loading: boolean;
  error: string | null;
}

export function useChat(chatId: string, recipientId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  // Send a message
  const sendMessage = useCallback(async (message: Message) => {
    try {
      if (!user) return;
      
      const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Save message to Firestore
      await addDoc(collection(db, "chats", chatId, "messages"), {
        ...message,
        timestamp: serverTimestamp(),
      });
      
      // Optionally emit via socket if real-time
      if (socketRef.current) {
        socketRef.current.emit('send_message', message);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  }, [user, chatId]);

  // Load messages
  useEffect(() => {
    if (!user || !chatId) return;
    
    const loadMessages = async () => {
      try {
        setLoading(true);
        
        const { collection, query, orderBy, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const q = query(
          collection(db, "chats", chatId, "messages"),
          orderBy("timestamp", "asc")
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messageList: Message[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            messageList.push({
              id: doc.id,
              senderId: data.senderId,
              recipientId: data.recipientId,
              content: data.content,
              timestamp: data.timestamp?.toDate?.() 
                ? data.timestamp.toDate().toISOString() 
                : new Date().toISOString(),
              read: data.read || false,
            });
          });
          
          setMessages(messageList);
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load messages");
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [user, chatId]);

  return { messages, sendMessage, loading, error };
}

interface UseChatSocketReturn {
  socket: Socket | null;
  connected: boolean;
  messages: Message[];
  sendMessage: (recipientId: string, content: string, chatId?: string) => void;
  markAsRead: (chatId: string) => void;
  setTyping: (recipientId: string, isTyping: boolean) => void;
  isUserTyping: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

export function useChatSocket(): UseChatSocketReturn {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUserTyping, setIsUserTyping] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store typing timeout IDs
  const typingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  // Initialize Socket.io connection
  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8080';
    const socketClient = io(SOCKET_URL);

    socketClient.on('connect', () => {
      console.log('Socket connected');
      // Authenticate with socket server
      socketClient.emit('authenticate', {
        uid: user.uid,
        displayName: user.displayName || 'User'
      });
    });

    socketClient.on('authenticated', () => {
      console.log('Socket authenticated');
      setConnected(true);
      setLoading(false);
    });

    socketClient.on('auth_error', (err) => {
      console.error('Socket authentication error:', err);
      setError('Authentication error with chat server');
      setLoading(false);
    });

    socketClient.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    socketClient.on('error', (err) => {
      console.error('Socket error:', err);
      setError(err.message || 'Error with chat connection');
    });

    socketClient.on('new_message', (message: Message) => {
      console.log('New message received:', message);
      setMessages(prevMessages => [...prevMessages, message]);
    });

    socketClient.on('message_sent', (message: Message) => {
      console.log('Message sent confirmation:', message);
      // This ensures we don't duplicate messages that might also come from Firestore
      setMessages(prevMessages => {
        // Check if we already have this message (by comparing content and timestamp)
        const exists = prevMessages.some(
          m => m.senderId === message.senderId && 
               m.content === message.content && 
               m.timestamp === message.timestamp
        );
        
        if (exists) return prevMessages;
        return [...prevMessages, message];
      });
    });

    socketClient.on('user_typing', ({ userId, isTyping }) => {
      setIsUserTyping(prev => ({
        ...prev,
        [userId]: isTyping
      }));
      
      // Clear typing indicator after 3 seconds if no updates
      if (isTyping && typingTimeouts.current[userId]) {
        clearTimeout(typingTimeouts.current[userId]);
      }
      
      if (isTyping) {
        typingTimeouts.current[userId] = setTimeout(() => {
          setIsUserTyping(prev => ({
            ...prev,
            [userId]: false
          }));
        }, 3000);
      }
    });

    setSocket(socketClient);

    // Cleanup on unmount
    return () => {
      Object.values(typingTimeouts.current).forEach(timeout => clearTimeout(timeout));
      socketClient.disconnect();
    };
  }, [user]);

  // Function to send a message
  const sendMessage = useCallback((recipientId: string, content: string, chatId?: string) => {
    if (!socket || !connected || !user) {
      setError('Cannot send message: not connected');
      return;
    }

    const timestamp = new Date().toISOString();
    
    socket.emit('send_message', {
      recipientId,
      content,
      timestamp,
      chatId
    });
  }, [socket, connected, user]);

  // Function to mark messages as read
  const markAsRead = useCallback((chatId: string) => {
    if (!socket || !connected || !user) return;
    
    socket.emit('mark_as_read', { chatId });
  }, [socket, connected, user]);

  // Function to indicate typing status
  const setTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (!socket || !connected || !user) return;
    
    socket.emit('typing', { recipientId, isTyping });
  }, [socket, connected, user]);

  return {
    socket,
    connected,
    messages,
    sendMessage,
    markAsRead,
    setTyping,
    isUserTyping,
    loading,
    error
  };
}
