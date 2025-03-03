import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase"; // Assuming firebase initialization is elsewhere
import { useRouter } from "next/router";
import { useToast } from "@chakra-ui/react"; // Assuming Chakra UI is used for toasts
import { useEffect, useState } from "react";


// ... other imports and component code ...

function ChatPage({ chatId }: { chatId: string }) { // Assumed props
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const user =  // ... fetch current user somehow ...;
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (chatId && user) {
      const conversationRef = doc(db, "conversations", chatId);
      const unsubscribe = onSnapshot(conversationRef, (doc) => {
        if (doc.exists()) {
          const conversationData = doc.data() as ConversationData;
          setConversation(conversationData);

          if (!conversationData.participants.includes(user.uid)) {
            toast({
              title: "Access denied",
              description: "You don't have permission to view this conversation.",
              variant: "destructive",
            });
            router.push("/chat");
            return;
          }

          const partnerId = conversationData.participants.find((id) => id !== user.uid);
          setPartnerId(partnerId || null);

          if (partnerId) {
            const partnerRef = doc(db, "users", partnerId);
            const partnerUnsubscribe = onSnapshot(partnerRef, (userDoc) => {
              if (userDoc.exists()) {
                const userData = userDoc.data();
                if (conversation && (!conversation.participantInfo[partnerId] || 
                    conversation.participantInfo[partnerId].displayName !== userData.displayName ||
                    conversation.participantInfo[partnerId].photoURL !== userData.photoURL)) {
                  updateDoc(conversationRef, {
                    [`participantInfo.${partnerId}`]: {
                      displayName: userData.displayName || userData.name || "User",
                      photoURL: userData.photoURL || "/placeholder-user.jpg"
                    }
                  }).catch(err => console.error("Error updating participant info:", err));
                }
              }
            });

            return () => {
              partnerUnsubscribe();
              unsubscribe();
            };
          }
        } else {
          toast({
            title: "Conversation not found",
            description: "This conversation may have been deleted.",
            variant: "destructive",
          });
          router.push("/chat");
        }
      });

      return () => unsubscribe();
    }
  }, [chatId, user, router, toast, conversation]);

  // ... rest of the ChatPage component ...
}

export default ChatPage;

// Define type for ConversationData if not already defined elsewhere
interface ConversationData {
  participants: string[];
  participantInfo?: { [key: string]: { displayName: string; photoURL: string } };
  // ... other conversation data ...
}