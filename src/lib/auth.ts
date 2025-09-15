import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import { shouldUseMockData } from './database';

// Mock auth for development
const mockAuth: NextAuthOptions = {
  providers: [],
  callbacks: {
    async session({ session, token }) {
      // Mock user data
      session.user = {
        id: 'user1',
        email: 'demo@mindfulreplay.com',
        name: 'Demo User',
        image: null
      };
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = 'user1';
      }
      return token;
    }
  },
  session: {
    strategy: 'jwt'
  }
};

// Real auth configuration
const realAuth: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Add providers here when ready
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id || token.id as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  session: {
    strategy: 'database'
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET || 'mindfulreplay-fallback-secret-for-demo'
};

export const authOptions: NextAuthOptions = shouldUseMockData() ? mockAuth : realAuth;