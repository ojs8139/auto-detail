import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const getSupabaseUrl = (): string => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('환경 변수 NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  }
  return url;
};

const getSupabaseKey = (): string => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('환경 변수 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.');
  }
  return key;
};

// 사용자가 직접 설정한 자격 증명 저장 변수
let customSupabaseUrl: string | null = null;
let customSupabaseKey: string | null = null;

// Supabase 클라이언트 인스턴스를 저장할 변수
let supabaseInstance: SupabaseClient | null = null;

// Supabase 자격 증명 설정 함수
export const setSupabaseCredentials = (url: string, key: string): void => {
  customSupabaseUrl = url;
  customSupabaseKey = key;
  
  // 기존 인스턴스를 무효화하여 다음 호출에서 새로운 자격 증명으로 재생성되도록 함
  supabaseInstance = null;
};

// Supabase URL 가져오기 (사용자 설정 우선)
const getEffectiveSupabaseUrl = (): string => {
  if (customSupabaseUrl) {
    return customSupabaseUrl;
  }
  return getSupabaseUrl();
};

// Supabase 키 가져오기 (사용자 설정 우선)
const getEffectiveSupabaseKey = (): string => {
  if (customSupabaseKey) {
    return customSupabaseKey;
  }
  return getSupabaseKey();
};

// Supabase 클라이언트를 초기화하는 함수
export const initSupabase = (): SupabaseClient => {
  try {
    const url = getEffectiveSupabaseUrl();
    const key = getEffectiveSupabaseKey();
    
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    
    return supabaseInstance;
  } catch (error) {
    console.error('Supabase 클라이언트 초기화 오류:', error);
    throw error;
  }
};

// Supabase 클라이언트 가져오기 (초기화되지 않은 경우 초기화)
export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    return initSupabase();
  }
  return supabaseInstance;
};

// 이전 버전과의 호환성을 위해 남겨두는 함수
export const hasSupabaseCredentials = (): boolean => {
  try {
    getEffectiveSupabaseUrl();
    getEffectiveSupabaseKey();
    return true;
  } catch (error) {
    return false;
  }
};

// Supabase 연결 테스트 - 개발 디버깅용
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const client = getSupabaseClient();
    
    // 기본 테이블 목록 조회 (가장 기본적인 권한 테스트)
    const { data, error } = await client.from('projects').select('id').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        // 테이블이 없는 경우 - 아직 스키마가 생성되지 않았지만 연결은 성공한 것으로 간주
        return {
          success: true,
          message: '연결은 성공했지만 필요한 테이블이 없습니다. 스키마를 먼저 생성해야 합니다.'
        };
      } else {
        return {
          success: false,
          message: `데이터베이스 조회 오류: ${error.message}`
        };
      }
    }
    
    return {
      success: true,
      message: '연결 성공!'
    };
  } catch (error) {
    return {
      success: false,
      message: `연결 테스트 중 오류 발생: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}; 