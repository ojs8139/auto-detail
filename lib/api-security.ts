"use client";

import { ApiKeyManager } from './security';
import { InputValidator } from './validation';

/**
 * API 요청 속도 제한 관리
 */
export const RateLimiter = {
  // 요청 타임스탬프 기록 객체
  requestTimestamps: new Map<string, number[]>(),
  
  /**
   * 요청 속도 제한 확인
   * @param key 요청 식별자 (API 엔드포인트, 사용자 ID 등)
   * @param maxRequests 최대 요청 수
   * @param timeWindow 시간 창 (밀리초)
   * @returns 요청 허용 여부
   */
  checkLimit: (key: string, maxRequests: number = 10, timeWindow: number = 60000): boolean => {
    const now = Date.now();
    
    // 이전 요청 타임스탬프 가져오기
    let timestamps = RateLimiter.requestTimestamps.get(key) || [];
    
    // 시간 창 내의 요청만 필터링
    timestamps = timestamps.filter(time => now - time < timeWindow);
    
    // 요청 수 확인
    if (timestamps.length >= maxRequests) {
      return false; // 요청 거부
    }
    
    // 현재 요청 시간 추가
    timestamps.push(now);
    RateLimiter.requestTimestamps.set(key, timestamps);
    
    return true; // 요청 허용
  },
  
  /**
   * 다음 요청까지 대기 시간 계산
   * @param key 요청 식별자
   * @param maxRequests 최대 요청 수
   * @param timeWindow 시간 창 (밀리초)
   * @returns 대기 시간 (밀리초), 0이면 즉시 요청 가능
   */
  getWaitTime: (key: string, maxRequests: number = 10, timeWindow: number = 60000): number => {
    const now = Date.now();
    const timestamps = RateLimiter.requestTimestamps.get(key) || [];
    
    if (timestamps.length < maxRequests) {
      return 0; // 즉시 요청 가능
    }
    
    // 시간 창 기준으로 정렬된 배열에서 가장 오래된 요청 시간
    const oldestTimestamp = timestamps.sort((a, b) => a - b)[0];
    
    // 다음 요청 가능 시간까지 대기 시간
    return Math.max(0, (oldestTimestamp + timeWindow) - now);
  },
  
  /**
   * 제한 상태 초기화
   * @param key 요청 식별자
   */
  resetLimit: (key: string): void => {
    RateLimiter.requestTimestamps.delete(key);
  }
};

/**
 * API 요청 재시도 관리
 */
export const RetryManager = {
  /**
   * 지수 백오프 알고리즘을 사용한 재시도 함수
   * @param apiFunction API 호출 함수
   * @param maxRetries 최대 재시도 횟수
   * @param baseDelay 기본 지연 시간 (밀리초)
   * @returns API 응답 결과
   */
  withRetry: async <T>(
    apiFunction: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let retries = 0;
    let lastError: any;
    
    while (retries <= maxRetries) {
      try {
        return await apiFunction();
      } catch (error) {
        lastError = error;
        retries++;
        
        // 최대 재시도 횟수를 초과하면 에러 발생
        if (retries > maxRetries) {
          throw error;
        }
        
        // 지수 백오프 지연 계산 (예: 1초, 2초, 4초, ...)
        const delay = baseDelay * Math.pow(2, retries - 1);
        
        // 랜덤 요소 추가로 여러 클라이언트가 동시에 재시도하는 것을 방지
        const jitter = Math.random() * 100;
        
        // 지연 시간 대기
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
    
    // 모든 재시도 실패 시
    throw lastError;
  }
};

/**
 * API 요청 캐싱 관리
 */
export const ApiCache = {
  // 캐시 스토리지
  cache: new Map<string, { data: any; expiry: number }>(),
  
  /**
   * API 응답 캐싱
   * @param key 캐시 키
   * @param data 캐시할 데이터
   * @param ttl 유효 시간 (밀리초)
   */
  set: (key: string, data: any, ttl: number = 3600000): void => {
    const expiry = Date.now() + ttl;
    ApiCache.cache.set(key, { data, expiry });
    
    // 로컬 스토리지에도 저장 (영구 캐시)
    try {
      const cacheItem = { data, expiry };
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('캐시 로컬 스토리지 저장 중 오류 발생:', error);
    }
  },
  
  /**
   * 캐시된 API 응답 조회
   * @param key 캐시 키
   * @returns 캐시된 데이터 또는 null
   */
  get: (key: string): any => {
    // 메모리 캐시 확인
    const cachedItem = ApiCache.cache.get(key);
    
    if (cachedItem && cachedItem.expiry > Date.now()) {
      return cachedItem.data;
    }
    
    // 메모리 캐시에 없으면 로컬 스토리지 확인
    try {
      const storedItem = localStorage.getItem(`api_cache_${key}`);
      if (storedItem) {
        const parsedItem = JSON.parse(storedItem);
        
        // 유효 기간 확인
        if (parsedItem.expiry > Date.now()) {
          // 메모리 캐시에도 복원
          ApiCache.cache.set(key, parsedItem);
          return parsedItem.data;
        } else {
          // 만료된 캐시 삭제
          localStorage.removeItem(`api_cache_${key}`);
        }
      }
    } catch (error) {
      console.error('캐시 로컬 스토리지 조회 중 오류 발생:', error);
    }
    
    return null;
  },
  
  /**
   * 캐시 항목 삭제
   * @param key 캐시 키
   */
  invalidate: (key: string): void => {
    ApiCache.cache.delete(key);
    try {
      localStorage.removeItem(`api_cache_${key}`);
    } catch (error) {
      console.error('캐시 로컬 스토리지 삭제 중 오류 발생:', error);
    }
  },
  
  /**
   * 모든 캐시 항목 삭제
   */
  clear: (): void => {
    ApiCache.cache.clear();
    try {
      // 로컬 스토리지에서 api_cache_ 프리픽스를 가진 항목들만 삭제
      Object.keys(localStorage)
        .filter(key => key.startsWith('api_cache_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('캐시 로컬 스토리지 초기화 중 오류 발생:', error);
    }
  }
};

/**
 * 보안 API 호출 래퍼
 * @param url API URL
 * @param options fetch 옵션
 * @param cacheKey 캐시 키 (캐싱 사용 시)
 * @param cacheTtl 캐시 유효 시간 (밀리초)
 * @returns API 응답 데이터
 */
export async function secureApiCall<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTtl?: number
): Promise<T> {
  // URL 유효성 검사
  if (!InputValidator.isValidUrl(url)) {
    throw new Error('유효하지 않은 API URL');
  }
  
  // 캐시 확인 (캐시 키가 제공된 경우)
  if (cacheKey) {
    const cachedData = ApiCache.get(cacheKey);
    if (cachedData) {
      return cachedData as T;
    }
  }
  
  // 요청 헤더 기본값
  const headers = new Headers(options.headers || {});
  
  // Content-Type 설정
  if (!headers.has('Content-Type') && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }
  
  // 요청 속도 제한 확인
  const rateLimitKey = url.split('?')[0];
  if (!RateLimiter.checkLimit(rateLimitKey)) {
    const waitTime = RateLimiter.getWaitTime(rateLimitKey);
    throw new Error(`요청 속도 제한 초과. ${Math.ceil(waitTime / 1000)}초 후에 다시 시도하세요.`);
  }
  
  // API 호출 재시도 로직 적용
  try {
    const response = await RetryManager.withRetry(async () => {
      const res = await fetch(url, {
        ...options,
        headers
      });
      
      // 오류 응답 처리
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API 요청 실패: ${res.status} ${res.statusText}\n${errorText}`);
      }
      
      return res;
    });
    
    // 응답 형식에 따른 처리
    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json() as T;
    } else {
      // JSON이 아닌 경우 텍스트로 처리
      const text = await response.text();
      data = text as unknown as T;
    }
    
    // 결과 캐싱 (캐시 키가 제공된 경우)
    if (cacheKey && data) {
      ApiCache.set(cacheKey, data, cacheTtl);
    }
    
    return data;
  } catch (error) {
    // 오류 로깅 및 재전달
    console.error('API 호출 중 오류 발생:', error);
    throw error;
  }
} 