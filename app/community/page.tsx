'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to prevent Firebase Auth errors during build
const CommunityPage = dynamic(() => import('@/components/community/community-page'), {
  ssr: false,
  loading: () => <p>Loading community...</p>
});

export default function Page() {
  return <CommunityPage />;
}