
import { db } from './firebase';
import { collection, query, where, orderBy, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

// Create a consistent chat ID from two user IDs
export function createChatId(uid1: string, uid2: string): string {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Get all chats for a user
export async function getUserChats(userId: string) {
  try {
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );
    
    const chatDocs = await getDocs(chatsQuery);
    
    const chats = await Promise.all(
      chatDocs.docs.map(async (chatDoc) => {
        const chatData = chatDoc.data();
        const chatId = chatDoc.id;
        
        // Get the other participant
        const otherUserId = chatData.participants.find((id: string) => id !== userId);
        
        // Get other user's info
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        const userData = userDoc.data() || {};
        
        // Get chat metadata for unread count
        const metadataRef = doc(db, 'users', userId, 'chatMetadata', chatId);
        const metadataDoc = await getDoc(metadataRef);
        const metadata = metadataDoc.data() || { unreadCount: 0 };
        
        return {
          id: chatId,
          lastMessage: chatData.lastMessage,
          lastMessageTimestamp: chatData.lastMessageTimestamp,
          otherUser: {
            id: otherUserId,
            name: userData.name || userData.displayName || 'User',
            photoURL: userData.photoURL || null
          },
          unreadCount: metadata.unreadCount || 0
        };
      })
    );
    
    // Sort by last message timestamp
    return chats.sort((a, b) => {
      const dateA = new Date(a.lastMessageTimestamp || 0);
      const dateB = new Date(b.lastMessageTimestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
}

// Get messages for a specific chat
export async function getChatMessages(chatId: string) {
  try {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const messageDocs = await getDocs(messagesQuery);
    
    return messageDocs.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
}

// Send a message
export async function sendMessage(senderId: string, senderName: string, recipientId: string, content: string) {
  try {
    const chatId = createChatId(senderId, recipientId);
    const timestamp = new Date().toISOString();
    
    // Add message to the chat
    const messageRef = collection(db, 'chats', chatId, 'messages');
    const message = {
      senderId,
      senderName,
      recipientId,
      content,
      timestamp,
      read: false
    };
    
    await addDoc(messageRef, message);
    
    // Update chat metadata
    await setDoc(doc(db, 'chats', chatId), {
      participants: [senderId, recipientId],
      lastMessage: content,
      lastMessageTimestamp: timestamp,
      lastMessageSenderId: senderId
    }, { merge: true });
    
    // For recipient, increment unread count
    await setDoc(doc(db, 'users', recipientId, 'chatMetadata', chatId), {
      withUser: senderId,
      unreadCount: (await getUnreadCount(recipientId, chatId)) + 1,
      lastMessageTimestamp: timestamp
    }, { merge: true });
    
    // For sender, ensure record exists with 0 unread
    await setDoc(doc(db, 'users', senderId, 'chatMetadata', chatId), {
      withUser: recipientId,
      unreadCount: 0,
      lastMessageTimestamp: timestamp
    }, { merge: true });
    
    return { ...message, chatId };
    
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Get unread count for a chat
async function getUnreadCount(userId: string, chatId: string) {
  try {
    const metadataRef = doc(db, 'users', userId, 'chatMetadata', chatId);
    const metadataDoc = await getDoc(metadataRef);
    return metadataDoc.exists() ? (metadataDoc.data().unreadCount || 0) : 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

// Mark messages as read
export async function markMessagesAsRead(userId: string, chatId: string) {
  try {
    // Reset unread counter
    await setDoc(doc(db, 'users', userId, 'chatMetadata', chatId), {
      unreadCount: 0
    }, { merge: true });
    
    // Get unread messages
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    
    const messageDocs = await getDocs(messagesQuery);
    
    // Mark each message as read
    const updatePromises = messageDocs.docs.map(messageDoc => 
      setDoc(doc(db, 'chats', chatId, 'messages', messageDoc.id), { read: true }, { merge: true })
    );
    
    await Promise.all(updatePromises);
    
    return messageDocs.size; // Return count of messages marked as read
    
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}

// Start or get a chat with another user
export async function startChat(currentUserId: string, currentUserName: string, otherUserId: string) {
  try {
    const chatId = createChatId(currentUserId, otherUserId);
    
    // Check if chat already exists
    const chatRef = doc(db, 'chats', chatId);
    const chatDoc = await getDoc(chatRef);
    
    if (!chatDoc.exists()) {
      // Create new chat
      await setDoc(chatRef, {
        participants: [currentUserId, otherUserId],
        createdAt: new Date().toISOString(),
      });
      
      // Initialize chat metadata for both users
      await setDoc(doc(db, 'users', currentUserId, 'chatMetadata', chatId), {
        withUser: otherUserId,
        unreadCount: 0,
        createdAt: new Date().toISOString()
      });
      
      await setDoc(doc(db, 'users', otherUserId, 'chatMetadata', chatId), {
        withUser: currentUserId,
        withUserName: currentUserName,
        unreadCount: 0,
        createdAt: new Date().toISOString()
      });
    }
    
    return chatId;
    
  } catch (error) {
    console.error('Error starting chat:', error);
    throw error;
  }
}
