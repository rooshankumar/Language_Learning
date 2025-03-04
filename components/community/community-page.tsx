
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AppShell } from '@/components/app-shell';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { startChat } from '@/lib/chat-service';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface User {
  uid: string;
  displayName?: string;
  photoURL?: string;
  about?: string;
  nativeLanguages?: string[];
  learningLanguages?: string[];
}

export default function CommunityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (!user) return;
    
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        const usersList: User[] = [];
        
        for (const userDoc of usersSnapshot.docs) {
          // Don't include the current user
          if (userDoc.id === user.uid) continue;
          
          usersList.push({
            uid: userDoc.id,
            ...userDoc.data() as Omit<User, 'uid'>
          });
        }
        
        setUsers(usersList);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUsers();
  }, [user]);
  
  const handleStartChat = async (otherUser: User) => {
    if (!user) return;
    
    try {
      // Get current user info
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      const currentUserData = currentUserDoc.data();
      const currentUserName = currentUserData?.displayName || user.displayName || 'User';
      
      // Start or get existing chat
      const chatId = await startChat(user.uid, currentUserName, otherUser.uid);
      
      // Navigate to chat
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const displayName = user.displayName?.toLowerCase() || '';
    const nativeLanguages = user.nativeLanguages?.join(' ').toLowerCase() || '';
    const learningLanguages = user.learningLanguages?.join(' ').toLowerCase() || '';
    
    return (
      displayName.includes(searchLower) ||
      nativeLanguages.includes(searchLower) ||
      learningLanguages.includes(searchLower)
    );
  });
  
  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full">
          <div>Loading community data...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="text-muted-foreground mt-1">Connect with language partners from around the world</p>
          </div>
          <div className="mt-4 md:mt-0 w-full md:w-auto">
            <Input
              placeholder="Search by name or language..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </div>
        
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No users found</h3>
            <p className="text-muted-foreground mt-2">Try adjusting your search or check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map((userItem) => (
              <Card key={userItem.uid} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={userItem.photoURL || ''} alt={userItem.displayName || 'User'} />
                      <AvatarFallback>{(userItem.displayName || 'User').substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle>{userItem.displayName || 'User'}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{userItem.about || 'No bio available'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="mt-2">
                    <div className="mb-2">
                      <p className="text-sm font-medium mb-1">Native languages:</p>
                      <div className="flex flex-wrap gap-1">
                        {userItem.nativeLanguages?.length ? (
                          userItem.nativeLanguages.map((lang) => (
                            <Badge key={lang} variant="outline" className="bg-primary/10">{lang}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None specified</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Learning:</p>
                      <div className="flex flex-wrap gap-1">
                        {userItem.learningLanguages?.length ? (
                          userItem.learningLanguages.map((lang) => (
                            <Badge key={lang} variant="outline" className="bg-secondary/10">{lang}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    className="w-full" 
                    onClick={() => handleStartChat(userItem)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
