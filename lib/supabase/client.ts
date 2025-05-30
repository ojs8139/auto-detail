/**
 * Supabase 클라이언트 생성을 위한 유틸리티
 * 앱 전체에서 일관된 Supabase 클라이언트 인스턴스를 사용할 수 있도록 합니다.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase URL과 API 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 클라이언트 유효성 검사 오류
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') { // 클라이언트 사이드에서만 경고
    console.warn('Supabase URL 또는 API 키가 없습니다. Supabase 기능이 작동하지 않을 수 있습니다.');
  }
}

/**
 * Supabase 클라이언트를 생성합니다.
 * @returns Supabase 클라이언트 인스턴스
 */
export const createClient = () => {
  return createSupabaseClient(
    supabaseUrl || '',
    supabaseAnonKey || ''
  );
};

/**
 * 서버 컴포넌트에서 사용할 수 있는 Supabase 클라이언트를 생성합니다.
 * 이 함수는 서버 컴포넌트에서만 호출해야 합니다.
 * @returns Supabase 클라이언트 인스턴스
 */
export const createServerClient = () => {
  // 서버 사이드에서 환경 변수 접근
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase URL 또는 서비스 키가 없습니다.');
  }
  
  return createSupabaseClient(supabaseUrl, supabaseServiceKey);
}; 