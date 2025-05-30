"use client";

import DOMPurify from 'dompurify';

/**
 * 입력 유효성 검사 및 살균 처리 유틸리티
 */
export const InputValidator = {
  /**
   * 이메일 형식 검증
   * @param email 검증할 이메일
   * @returns 유효성 여부
   */
  isValidEmail: (email: string): boolean => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * URL 형식 검증
   * @param url 검증할 URL
   * @returns 유효성 여부
   */
  isValidUrl: (url: string): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 비밀번호 강도 검증
   * @param password 검증할 비밀번호
   * @returns 비밀번호 강도 (0-4, 숫자가 클수록 강함)
   */
  getPasswordStrength: (password: string): number => {
    if (!password) return 0;
    
    let strength = 0;
    
    // 길이 검사
    if (password.length >= 8) strength += 1;
    
    // 대문자 포함 검사
    if (/[A-Z]/.test(password)) strength += 1;
    
    // 특수문자 포함 검사
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;
    
    // 숫자 포함 검사
    if (/[0-9]/.test(password)) strength += 1;
    
    return strength;
  },

  /**
   * API 키 형식 검증
   * @param key 검증할 API 키
   * @param type 키 타입 ('openai', 'supabase' 등)
   * @returns 유효성 여부
   */
  isValidApiKey: (key: string, type: 'openai' | 'supabase' | string): boolean => {
    if (!key) return false;

    // 키 타입별 패턴 검증
    switch (type) {
      case 'openai':
        return /^sk-[a-zA-Z0-9]{32,}$/.test(key);
      case 'supabase':
        // Supabase API 키 패턴
        return key.length > 20;
      default:
        // 기본 검증: 최소 길이
        return key.length >= 16;
    }
  },

  /**
   * 문자열 최대 길이 제한
   * @param str 검사할 문자열
   * @param maxLength 최대 길이
   * @returns 제한된 문자열
   */
  truncateString: (str: string, maxLength: number): string => {
    if (!str) return '';
    return str.length <= maxLength ? str : str.slice(0, maxLength);
  }
};

/**
 * HTML 살균 처리 유틸리티
 */
export const Sanitizer = {
  /**
   * HTML 문자열 살균 처리
   * @param html 살균할 HTML 문자열
   * @returns 살균된 HTML 문자열
   */
  sanitizeHtml: (html: string): string => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'b', 'i', 'u', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'hr', 'em', 'strong', 'span', 'div'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'style', 'class', 'target'
      ]
    });
  },

  /**
   * 일반 텍스트 살균 처리 (HTML 태그 모두 제거)
   * @param text 살균할 텍스트
   * @returns 살균된 텍스트
   */
  sanitizeText: (text: string): string => {
    if (!text) return '';
    return DOMPurify.sanitize(text, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  },

  /**
   * 이스케이프 처리 (HTML 엔티티로 변환)
   * @param text 이스케이프할 텍스트
   * @returns 이스케이프된 텍스트
   */
  escapeHtml: (text: string): string => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /**
   * JSON 문자열 안전 파싱
   * @param jsonString 파싱할 JSON 문자열
   * @returns 파싱된 객체 또는 null
   */
  safeJsonParse: <T>(jsonString: string): T | null => {
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('JSON 파싱 중 오류 발생:', error);
      return null;
    }
  }
}; 