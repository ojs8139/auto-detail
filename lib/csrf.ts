"use client";

import { DataEncryption } from './security';
import React from 'react';
import Cookies from 'js-cookie';

// CSRF 토큰 관련 상수
const CSRF_TOKEN_COOKIE_NAME = 'csrf_token';
const CSRF_TOKEN_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_FORM_FIELD = '_csrf';
const CSRF_TOKEN_EXPIRY_DAYS = 7;

/**
 * CSRF 보호 유틸리티
 */
export const CSRFProtection = {
  /**
   * CSRF 토큰 생성
   * @returns 생성된 CSRF 토큰
   */
  generateToken: (): string => {
    try {
      // 랜덤 토큰 생성 (32바이트 무작위 문자열)
      const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
      const token = Array.from(randomBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      
      // 토큰 저장
      CSRFProtection.saveToken(token);
      
      return token;
    } catch (error) {
      console.error('CSRF 토큰 생성 중 오류 발생:', error);
      
      // 대체 토큰 생성 (crypto API 사용 불가 시)
      const fallbackToken = Math.random().toString(36).substring(2, 15) + 
                           Math.random().toString(36).substring(2, 15) +
                           Date.now().toString(36);
      
      CSRFProtection.saveToken(fallbackToken);
      
      return fallbackToken;
    }
  },
  
  /**
   * CSRF 토큰 저장 (쿠키)
   * @param token CSRF 토큰
   */
  saveToken: (token: string): void => {
    try {
      // 암호화된 토큰 저장
      const encryptedToken = DataEncryption.encrypt(token);
      
      // HttpOnly, Secure 쿠키로 저장 (SameSite=Strict)
      Cookies.set(CSRF_TOKEN_COOKIE_NAME, encryptedToken, {
        expires: CSRF_TOKEN_EXPIRY_DAYS,
        sameSite: 'Strict',
        secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 Secure 활성화
        path: '/'
      });
      
      // localStorage에도 백업 저장 (이중 보호)
      localStorage.setItem(CSRF_TOKEN_COOKIE_NAME, encryptedToken);
    } catch (error) {
      console.error('CSRF 토큰 저장 중 오류 발생:', error);
    }
  },
  
  /**
   * 저장된 CSRF 토큰 가져오기
   * @returns CSRF 토큰 또는 빈 문자열
   */
  getToken: (): string => {
    try {
      // 쿠키에서 암호화된 토큰 가져오기
      let encryptedToken = Cookies.get(CSRF_TOKEN_COOKIE_NAME);
      
      // 쿠키에 없으면 localStorage에서 시도
      if (!encryptedToken) {
        const localStorageToken = localStorage.getItem(CSRF_TOKEN_COOKIE_NAME);
        encryptedToken = localStorageToken || undefined;
        
        // localStorage에도 없으면 새 토큰 생성
        if (!encryptedToken) {
          return CSRFProtection.generateToken();
        }
      }
      
      // 토큰 복호화
      const token = DataEncryption.decrypt(encryptedToken);
      return token || CSRFProtection.generateToken();
    } catch (error) {
      console.error('CSRF 토큰 가져오기 중 오류 발생:', error);
      return CSRFProtection.generateToken();
    }
  },
  
  /**
   * CSRF 토큰 유효성 검증
   * @param token 검증할 토큰
   * @returns 유효성 여부
   */
  validateToken: (token: string): boolean => {
    try {
      const savedToken = CSRFProtection.getToken();
      
      // 제공된 토큰과 저장된 토큰이 일치하지 않으면 유효하지 않음
      if (savedToken !== token) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('CSRF 토큰 검증 중 오류 발생:', error);
      return false;
    }
  },
  
  /**
   * CSRF 토큰 재생성
   * @returns 새로 생성된 CSRF 토큰
   */
  refreshToken: (): string => {
    try {
      // 기존 토큰 삭제
      Cookies.remove(CSRF_TOKEN_COOKIE_NAME, { path: '/' });
      localStorage.removeItem(CSRF_TOKEN_COOKIE_NAME);
      
      // 새 토큰 생성
      return CSRFProtection.generateToken();
    } catch (error) {
      console.error('CSRF 토큰 재생성 중 오류 발생:', error);
      return CSRFProtection.generateToken();
    }
  }
};

/**
 * CSRF 보호 양식 필드 (hidden input) 생성 React 컴포넌트
 */
export const CSRFTokenField: React.FC = () => {
  const token = CSRFProtection.getToken();
  
  return React.createElement('input', {
    type: 'hidden',
    name: CSRF_TOKEN_FORM_FIELD,
    value: token
  });
};

/**
 * CSRF 토큰을 요청 헤더에 추가하는 함수
 * @param headers 기존 헤더
 * @returns CSRF 토큰이 포함된 헤더
 */
export const addCSRFToken = (headers?: HeadersInit): Headers => {
  const token = CSRFProtection.getToken();
  const newHeaders = new Headers(headers || {});
  
  newHeaders.set(CSRF_TOKEN_HEADER_NAME, token);
  
  return newHeaders;
};

/**
 * CSRF 보호 fetch 래퍼 함수
 * @param url 요청 URL
 * @param options fetch 옵션
 * @returns fetch 응답
 */
export const fetchWithCSRF = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // CSRF 토큰을 헤더에 추가
  const headers = addCSRFToken(options.headers);
  
  // POST, PUT, DELETE, PATCH 요청인 경우 본문에도 CSRF 토큰 추가
  if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
    // JSON 요청이면 본문에 토큰 추가
    if (options.body && headers.get('Content-Type')?.includes('application/json')) {
      try {
        const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        const bodyWithToken = {
          ...body,
          [CSRF_TOKEN_FORM_FIELD]: CSRFProtection.getToken()
        };
        
        options.body = JSON.stringify(bodyWithToken);
      } catch (error) {
        console.error('CSRF 토큰을 요청 본문에 추가하는 중 오류 발생:', error);
      }
    }
  }
  
  // 옵션에 수정된 헤더 설정
  const updatedOptions = { ...options, headers };
  
  return fetch(url, updatedOptions);
}; 