/**
 * 인증 관련 유틸리티
 * NextAuth.js 인증 설정 및 함수를 제공합니다.
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from './supabase/client';
import { Session, User } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// 세션 타입 확장
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
  
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
  }
}

// JWT 타입 확장
declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
  }
}

/**
 * NextAuth 설정 옵션
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'email' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const supabase = createClient();

          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          });

          if (error || !data.user) {
            return null;
          }

          // 유저 정보 조회
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (userError || !userData) {
            return null;
          }

          return {
            id: data.user.id,
            name: userData.name || data.user.email,
            email: data.user.email,
            role: userData.role,
            image: userData.avatar_url,
          };
        } catch (error) {
          console.error('인증 오류:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // 초기 로그인 시 유저 정보를 토큰에 추가
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // 세션에 추가 정보 포함
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * 사용자의 권한을 확인합니다.
 * @param session 사용자 세션
 * @param requiredRole 필요한 권한
 * @returns 권한 보유 여부
 */
export const hasRole = (session: Session | null, requiredRole: string): boolean => {
  if (!session || !session.user) return false;
  
  const userRole = session.user.role;
  
  // 관리자는 모든 권한을 가짐
  if (userRole === 'admin') return true;
  
  // 역할이 일치하는지 확인
  return userRole === requiredRole;
};

/**
 * 사용자가 리소스의 소유자인지 확인합니다.
 * @param session 사용자 세션
 * @param resourceUserId 리소스 소유자 ID
 * @returns 소유자 여부
 */
export const isResourceOwner = (session: Session | null, resourceUserId: string): boolean => {
  if (!session || !session.user) return false;
  return session.user.id === resourceUserId;
};

/**
 * 현재 사용자의 ID를 반환합니다.
 * @param session 사용자 세션
 * @returns 사용자 ID 또는 null
 */
export const getCurrentUserId = (session: Session | null): string | null => {
  if (!session || !session.user) return null;
  return session.user.id;
}; 