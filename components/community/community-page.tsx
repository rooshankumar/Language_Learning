
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function CommunityPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Initialize any community data loading here
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading community data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Community</h1>
      {user ? (
        <div>
          <p>Welcome to the community, {user.displayName || 'User'}!</p>
          {/* Your community content here */}
        </div>
      ) : (
        <div>
          <p>Please sign in to access the community features.</p>
        </div>
      )}
    </div>
  );
}
