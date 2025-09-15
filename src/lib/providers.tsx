'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // For demo mode, provide a mock session immediately
  const mockSession = {
    user: {
      id: 'user1',
      email: 'demo@mindfulreplay.com',
      name: 'Demo User',
      image: null
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };

  return (
    <SessionProvider session={mockSession}>
      {children}
    </SessionProvider>
  );
}