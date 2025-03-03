"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"

interface ConversationData {
  participants: string[];
  participantInfo?: { [key: string]: { displayName: string; photoURL: string } };
}

export default function ChatPage() {
  const { id } = useParams();
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      router.push("/sign-in");
      return;
    }

    if (id && user) {
      const conversationRef = doc(db, "conversations", id);
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
  }, [id, user, router, toast]);

  return (
    <div>
      <h1>Chat ID: {id}</h1>
      {/* Add your chat UI components here */}
    </div>
  );
}