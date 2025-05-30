"use client";

import CryptoJS from 'crypto-js';

// 암호화 키 (실제 프로덕션에서는 환경 변수로 관리)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-encryption-key-for-development';

/**
 * API 키 관리 유틸리티
 */
export const ApiKeyManager = {
  /**
   * API 키 암호화하여 저장
   * @param key API 키 
   * @param keyName 키 이름 (예: 'openai', 'supabase')
   */
  storeApiKey: (key: string, keyName: string): void => {
    try {
      if (!key || !keyName) return;
      
      // 키 암호화
      const encryptedKey = CryptoJS.AES.encrypt(key, ENCRYPTION_KEY).toString();
      
      // 로컬 스토리지에 저장
      localStorage.setItem(`api_key_${keyName}`, encryptedKey);
      
      // 마지막 갱신 시간 저장
      localStorage.setItem(`api_key_${keyName}_updated`, new Date().toISOString());
    } catch (error) {
      console.error('API 키 저장 중 오류 발생:', error);
    }
  },

  /**
   * 저장된 API 키 가져오기
   * @param keyName 키 이름 (예: 'openai', 'supabase')
   * @returns 복호화된 API 키 또는 null
   */
  getApiKey: (keyName: string): string | null => {
    try {
      // 암호화된 키 가져오기
      const encryptedKey = localStorage.getItem(`api_key_${keyName}`);
      if (!encryptedKey) return null;
      
      // 키 복호화
      const decryptedKey = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return decryptedKey;
    } catch (error) {
      console.error('API 키 가져오기 중 오류 발생:', error);
      return null;
    }
  },

  /**
   * API 키 삭제
   * @param keyName 키 이름 (예: 'openai', 'supabase')
   */
  removeApiKey: (keyName: string): void => {
    try {
      localStorage.removeItem(`api_key_${keyName}`);
      localStorage.removeItem(`api_key_${keyName}_updated`);
    } catch (error) {
      console.error('API 키 삭제 중 오류 발생:', error);
    }
  },

  /**
   * API 키가 저장되어 있는지 확인
   * @param keyName 키 이름 (예: 'openai', 'supabase')
   * @returns 키 존재 여부
   */
  hasApiKey: (keyName: string): boolean => {
    return !!localStorage.getItem(`api_key_${keyName}`);
  },

  /**
   * API 키 마스킹 (일부만 표시)
   * @param key 원본 API 키
   * @returns 마스킹된 키 (예: sk-****-****-ABC)
   */
  maskApiKey: (key: string): string => {
    if (!key || key.length < 8) return '****';
    
    const firstPart = key.substring(0, 3);
    const lastPart = key.substring(key.length - 3);
    const maskedPart = '*'.repeat(Math.min(10, key.length - 6));
    
    return `${firstPart}${maskedPart}${lastPart}`;
  }
};

/**
 * 데이터 암호화 유틸리티
 */
export const DataEncryption = {
  /**
   * 문자열 암호화
   * @param data 암호화할 데이터
   * @returns 암호화된 문자열
   */
  encrypt: (data: string): string => {
    try {
      return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('데이터 암호화 중 오류 발생:', error);
      return '';
    }
  },

  /**
   * 문자열 복호화
   * @param encryptedData 암호화된 문자열
   * @returns 복호화된 데이터
   */
  decrypt: (encryptedData: string): string => {
    try {
      return CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('데이터 복호화 중 오류 발생:', error);
      return '';
    }
  },

  /**
   * 객체 암호화
   * @param data 암호화할 객체
   * @returns 암호화된 문자열
   */
  encryptObject: (data: any): string => {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('객체 암호화 중 오류 발생:', error);
      return '';
    }
  },

  /**
   * 암호화된 문자열을 객체로 복호화
   * @param encryptedData 암호화된 문자열
   * @returns 복호화된 객체 또는 null
   */
  decryptObject: <T>(encryptedData: string): T | null => {
    try {
      const decryptedString = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString) as T;
    } catch (error) {
      console.error('객체 복호화 중 오류 발생:', error);
      return null;
    }
  }
};

/**
 * 안전한 로컬 스토리지 유틸리티
 */
export const SecureStorage = {
  /**
   * 데이터 안전하게 저장
   * @param key 스토리지 키
   * @param data 저장할 데이터
   */
  setItem: (key: string, data: any): void => {
    try {
      const serializedData = typeof data === 'string' ? data : JSON.stringify(data);
      const encryptedData = DataEncryption.encrypt(serializedData);
      localStorage.setItem(key, encryptedData);
    } catch (error) {
      console.error('데이터 저장 중 오류 발생:', error);
    }
  },

  /**
   * 저장된 데이터 안전하게 가져오기
   * @param key 스토리지 키
   * @returns 복호화된 데이터 또는 null
   */
  getItem: <T>(key: string): T | null => {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;

      const decryptedData = DataEncryption.decrypt(encryptedData);
      try {
        // 객체인 경우 파싱
        return JSON.parse(decryptedData) as T;
      } catch {
        // 문자열인 경우 그대로 반환
        return decryptedData as unknown as T;
      }
    } catch (error) {
      console.error('데이터 가져오기 중 오류 발생:', error);
      return null;
    }
  },

  /**
   * 저장된 데이터 삭제
   * @param key 스토리지 키
   */
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('데이터 삭제 중 오류 발생:', error);
    }
  },

  /**
   * 모든 데이터 삭제
   */
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('스토리지 초기화 중 오류 발생:', error);
    }
  }
}; 