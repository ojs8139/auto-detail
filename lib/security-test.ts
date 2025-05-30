"use client";

import { ApiKeyManager, DataEncryption, SecureStorage } from './security';
import { InputValidator, Sanitizer } from './validation';
import { CSRFProtection, fetchWithCSRF } from './csrf';
import { RateLimiter, RetryManager, ApiCache, secureApiCall } from './api-security';

/**
 * 보안 기능 테스트 결과 인터페이스
 */
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

/**
 * 보안 기능 테스트 결과 그룹 인터페이스
 */
interface TestGroup {
  name: string;
  results: TestResult[];
  passCount: number;
  failCount: number;
}

/**
 * 보안 테스트 유틸리티
 */
export const SecurityTester = {
  /**
   * 모든 보안 테스트 실행
   * @returns 테스트 결과 그룹 배열
   */
  runAllTests: async (): Promise<TestGroup[]> => {
    const groups: TestGroup[] = [];
    
    // API 키 관리 테스트
    groups.push(await SecurityTester.testApiKeyManager());
    
    // 데이터 암호화 테스트
    groups.push(await SecurityTester.testDataEncryption());
    
    // 안전한 로컬 스토리지 테스트
    groups.push(await SecurityTester.testSecureStorage());
    
    // 입력 검증 테스트
    groups.push(await SecurityTester.testInputValidation());
    
    // HTML 살균 처리 테스트
    groups.push(await SecurityTester.testSanitizer());
    
    // CSRF 보호 테스트
    groups.push(await SecurityTester.testCSRFProtection());
    
    // API 보안 유틸리티 테스트
    groups.push(await SecurityTester.testApiSecurity());
    
    return groups;
  },
  
  /**
   * API 키 관리 테스트
   * @returns 테스트 결과 그룹
   */
  testApiKeyManager: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: 'API 키 관리',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // API 키 저장 및 가져오기 테스트
      const testKey = 'sk-test1234567890abcdefghijklmnopqrstuvwxyz';
      ApiKeyManager.storeApiKey(testKey, 'test');
      
      const retrievedKey = ApiKeyManager.getApiKey('test');
      const passed = retrievedKey === testKey;
      
      group.results.push({
        name: 'API 키 저장 및 가져오기',
        passed,
        message: passed ? '성공' : '실패: 저장된 키와 가져온 키가 일치하지 않습니다.'
      });
      
      if (passed) group.passCount++; else group.failCount++;
      
      // API 키 존재 여부 확인 테스트
      const hasKey = ApiKeyManager.hasApiKey('test');
      const hasKeyPassed = hasKey === true;
      
      group.results.push({
        name: 'API 키 존재 여부 확인',
        passed: hasKeyPassed,
        message: hasKeyPassed ? '성공' : '실패: 저장된 키의 존재 여부를 올바르게 확인하지 못했습니다.'
      });
      
      if (hasKeyPassed) group.passCount++; else group.failCount++;
      
      // API 키 마스킹 테스트
      const maskedKey = ApiKeyManager.maskApiKey(testKey);
      const maskingPassed = maskedKey !== testKey && maskedKey.length > 0 && maskedKey.includes('*');
      
      group.results.push({
        name: 'API 키 마스킹',
        passed: maskingPassed,
        message: maskingPassed ? '성공' : '실패: API 키가 올바르게 마스킹되지 않았습니다.'
      });
      
      if (maskingPassed) group.passCount++; else group.failCount++;
      
      // API 키 삭제 테스트
      ApiKeyManager.removeApiKey('test');
      const keyAfterRemoval = ApiKeyManager.getApiKey('test');
      const removalPassed = keyAfterRemoval === null;
      
      group.results.push({
        name: 'API 키 삭제',
        passed: removalPassed,
        message: removalPassed ? '성공' : '실패: API 키가 올바르게 삭제되지 않았습니다.'
      });
      
      if (removalPassed) group.passCount++; else group.failCount++;
    } catch (error) {
      console.error('API 키 관리 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: 'API 키 관리 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  },
  
  /**
   * 데이터 암호화 테스트
   * @returns 테스트 결과 그룹
   */
  testDataEncryption: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: '데이터 암호화',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // 문자열 암호화/복호화 테스트
      const originalText = '테스트 문자열';
      const encryptedText = DataEncryption.encrypt(originalText);
      const decryptedText = DataEncryption.decrypt(encryptedText);
      
      const stringEncryptionPassed = encryptedText !== originalText && decryptedText === originalText;
      
      group.results.push({
        name: '문자열 암호화/복호화',
        passed: stringEncryptionPassed,
        message: stringEncryptionPassed ? '성공' : '실패: 문자열이 올바르게 암호화/복호화되지 않았습니다.'
      });
      
      if (stringEncryptionPassed) group.passCount++; else group.failCount++;
      
      // 객체 암호화/복호화 테스트
      const originalObj = { name: '테스트', value: 123 };
      const encryptedObj = DataEncryption.encryptObject(originalObj);
      const decryptedObj = DataEncryption.decryptObject<typeof originalObj>(encryptedObj);
      
      const objectEncryptionPassed = typeof encryptedObj === 'string' && 
                                    decryptedObj !== null && 
                                    decryptedObj.name === originalObj.name && 
                                    decryptedObj.value === originalObj.value;
      
      group.results.push({
        name: '객체 암호화/복호화',
        passed: objectEncryptionPassed,
        message: objectEncryptionPassed ? '성공' : '실패: 객체가 올바르게 암호화/복호화되지 않았습니다.'
      });
      
      if (objectEncryptionPassed) group.passCount++; else group.failCount++;
      
      // 잘못된 암호화 문자열 처리 테스트
      const invalidEncrypted = 'invalid-encrypted-string';
      const decryptedInvalid = DataEncryption.decrypt(invalidEncrypted);
      
      const invalidHandlingPassed = decryptedInvalid === '';
      
      group.results.push({
        name: '잘못된 암호화 문자열 처리',
        passed: invalidHandlingPassed,
        message: invalidHandlingPassed ? '성공' : '실패: 잘못된 암호화 문자열이 올바르게 처리되지 않았습니다.'
      });
      
      if (invalidHandlingPassed) group.passCount++; else group.failCount++;
    } catch (error) {
      console.error('데이터 암호화 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: '데이터 암호화 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  },
  
  /**
   * 안전한 로컬 스토리지 테스트
   * @returns 테스트 결과 그룹
   */
  testSecureStorage: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: '안전한 로컬 스토리지',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // 데이터 저장 및 가져오기 테스트
      const testData = { id: 1, name: '테스트 데이터' };
      SecureStorage.setItem('test_data', testData);
      
      const retrievedData = SecureStorage.getItem<typeof testData>('test_data');
      const storagePassed = retrievedData !== null && 
                          retrievedData.id === testData.id && 
                          retrievedData.name === testData.name;
      
      group.results.push({
        name: '데이터 저장 및 가져오기',
        passed: storagePassed,
        message: storagePassed ? '성공' : '실패: 데이터가 올바르게 저장되거나 가져오지 못했습니다.'
      });
      
      if (storagePassed) group.passCount++; else group.failCount++;
      
      // 데이터 삭제 테스트
      SecureStorage.removeItem('test_data');
      const dataAfterRemoval = SecureStorage.getItem('test_data');
      const removalPassed = dataAfterRemoval === null;
      
      group.results.push({
        name: '데이터 삭제',
        passed: removalPassed,
        message: removalPassed ? '성공' : '실패: 데이터가 올바르게 삭제되지 않았습니다.'
      });
      
      if (removalPassed) group.passCount++; else group.failCount++;
      
      // 문자열 데이터 처리 테스트
      const testString = '문자열 테스트';
      SecureStorage.setItem('test_string', testString);
      const retrievedString = SecureStorage.getItem<string>('test_string');
      const stringPassed = retrievedString === testString;
      
      group.results.push({
        name: '문자열 데이터 처리',
        passed: stringPassed,
        message: stringPassed ? '성공' : '실패: 문자열 데이터가 올바르게 처리되지 않았습니다.'
      });
      
      if (stringPassed) group.passCount++; else group.failCount++;
      
      // 항목 삭제 후 스토리지 초기화
      SecureStorage.removeItem('test_string');
    } catch (error) {
      console.error('안전한 로컬 스토리지 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: '안전한 로컬 스토리지 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  },
  
  /**
   * 입력 검증 테스트
   * @returns 테스트 결과 그룹
   */
  testInputValidation: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: '입력 검증',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // 이메일 검증 테스트
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid-email';
      
      const emailValidationPassed = InputValidator.isValidEmail(validEmail) === true && 
                                  InputValidator.isValidEmail(invalidEmail) === false;
      
      group.results.push({
        name: '이메일 검증',
        passed: emailValidationPassed,
        message: emailValidationPassed ? '성공' : '실패: 이메일 검증이 올바르게 작동하지 않습니다.'
      });
      
      if (emailValidationPassed) group.passCount++; else group.failCount++;
      
      // URL 검증 테스트
      const validUrl = 'https://example.com';
      const invalidUrl = 'invalid-url';
      
      const urlValidationPassed = InputValidator.isValidUrl(validUrl) === true && 
                                InputValidator.isValidUrl(invalidUrl) === false;
      
      group.results.push({
        name: 'URL 검증',
        passed: urlValidationPassed,
        message: urlValidationPassed ? '성공' : '실패: URL 검증이 올바르게 작동하지 않습니다.'
      });
      
      if (urlValidationPassed) group.passCount++; else group.failCount++;
      
      // 비밀번호 강도 검증 테스트
      const weakPassword = 'weak';
      const strongPassword = 'Strong1@Password';
      
      const passwordValidationPassed = InputValidator.getPasswordStrength(weakPassword) < 
                                     InputValidator.getPasswordStrength(strongPassword);
      
      group.results.push({
        name: '비밀번호 강도 검증',
        passed: passwordValidationPassed,
        message: passwordValidationPassed ? '성공' : '실패: 비밀번호 강도 검증이 올바르게 작동하지 않습니다.'
      });
      
      if (passwordValidationPassed) group.passCount++; else group.failCount++;
      
      // 문자열 길이 제한 테스트
      const longString = 'This is a very long string that should be truncated';
      const truncatedString = InputValidator.truncateString(longString, 10);
      
      const truncationPassed = truncatedString.length === 10 && truncatedString === 'This is a ';
      
      group.results.push({
        name: '문자열 길이 제한',
        passed: truncationPassed,
        message: truncationPassed ? '성공' : '실패: 문자열 길이 제한이 올바르게 작동하지 않습니다.'
      });
      
      if (truncationPassed) group.passCount++; else group.failCount++;
    } catch (error) {
      console.error('입력 검증 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: '입력 검증 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  },
  
  /**
   * HTML 살균 처리 테스트
   * @returns 테스트 결과 그룹
   */
  testSanitizer: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: 'HTML 살균 처리',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // HTML 살균 테스트
      const dangerousHtml = '<script>alert("XSS");</script><p>안전한 HTML</p>';
      const sanitizedHtml = Sanitizer.sanitizeHtml(dangerousHtml);
      
      const htmlSanitizationPassed = !sanitizedHtml.includes('<script>') && sanitizedHtml.includes('<p>안전한 HTML</p>');
      
      group.results.push({
        name: 'HTML 살균 처리',
        passed: htmlSanitizationPassed,
        message: htmlSanitizationPassed ? '성공' : '실패: HTML 살균 처리가 올바르게 작동하지 않습니다.'
      });
      
      if (htmlSanitizationPassed) group.passCount++; else group.failCount++;
      
      // 일반 텍스트 변환 테스트
      const htmlText = '<p>HTML 태그 제거</p>';
      const plainText = Sanitizer.sanitizeText(htmlText);
      
      const textSanitizationPassed = !plainText.includes('<p>') && plainText.includes('HTML 태그 제거');
      
      group.results.push({
        name: '일반 텍스트 변환',
        passed: textSanitizationPassed,
        message: textSanitizationPassed ? '성공' : '실패: 일반 텍스트 변환이 올바르게 작동하지 않습니다.'
      });
      
      if (textSanitizationPassed) group.passCount++; else group.failCount++;
      
      // HTML 이스케이프 테스트
      const unescapedHtml = '<script>alert("XSS");</script>';
      const escapedHtml = Sanitizer.escapeHtml(unescapedHtml);
      
      const htmlEscapePassed = escapedHtml.includes('&lt;script&gt;') && !escapedHtml.includes('<script>');
      
      group.results.push({
        name: 'HTML 이스케이프',
        passed: htmlEscapePassed,
        message: htmlEscapePassed ? '성공' : '실패: HTML 이스케이프가 올바르게 작동하지 않습니다.'
      });
      
      if (htmlEscapePassed) group.passCount++; else group.failCount++;
      
      // 안전한 JSON 파싱 테스트
      const validJson = '{"key": "value"}';
      const invalidJson = '{key: value}';
      
      const validParsed = Sanitizer.safeJsonParse<{key: string}>(validJson);
      const invalidParsed = Sanitizer.safeJsonParse(invalidJson);
      
      const jsonParsePassed = validParsed !== null && validParsed.key === 'value' && invalidParsed === null;
      
      group.results.push({
        name: '안전한 JSON 파싱',
        passed: jsonParsePassed,
        message: jsonParsePassed ? '성공' : '실패: 안전한 JSON 파싱이 올바르게 작동하지 않습니다.'
      });
      
      if (jsonParsePassed) group.passCount++; else group.failCount++;
    } catch (error) {
      console.error('HTML 살균 처리 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: 'HTML 살균 처리 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  },
  
  /**
   * CSRF 보호 테스트
   * @returns 테스트 결과 그룹
   */
  testCSRFProtection: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: 'CSRF 보호',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // 토큰 생성 테스트
      const token = CSRFProtection.generateToken();
      const tokenPassed = token !== undefined && token.length > 0;
      
      group.results.push({
        name: 'CSRF 토큰 생성',
        passed: tokenPassed,
        message: tokenPassed ? '성공' : '실패: CSRF 토큰이 생성되지 않았습니다.'
      });
      
      if (tokenPassed) group.passCount++; else group.failCount++;
      
      // 토큰 가져오기 테스트
      const retrievedToken = CSRFProtection.getToken();
      const retrievalPassed = retrievedToken !== undefined && retrievedToken === token;
      
      group.results.push({
        name: 'CSRF 토큰 가져오기',
        passed: retrievalPassed,
        message: retrievalPassed ? '성공' : '실패: CSRF 토큰을 올바르게 가져오지 못했습니다.'
      });
      
      if (retrievalPassed) group.passCount++; else group.failCount++;
      
      // 토큰 검증 테스트
      const validationPassed = CSRFProtection.validateToken(token);
      
      group.results.push({
        name: 'CSRF 토큰 검증',
        passed: validationPassed,
        message: validationPassed ? '성공' : '실패: CSRF 토큰 검증이 올바르게 작동하지 않습니다.'
      });
      
      if (validationPassed) group.passCount++; else group.failCount++;
      
      // 토큰 재생성 테스트
      const newToken = CSRFProtection.refreshToken();
      const refreshPassed = newToken !== undefined && newToken !== token;
      
      group.results.push({
        name: 'CSRF 토큰 재생성',
        passed: refreshPassed,
        message: refreshPassed ? '성공' : '실패: CSRF 토큰이 올바르게 재생성되지 않았습니다.'
      });
      
      if (refreshPassed) group.passCount++; else group.failCount++;
    } catch (error) {
      console.error('CSRF 보호 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: 'CSRF 보호 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  },
  
  /**
   * API 보안 유틸리티 테스트
   * @returns 테스트 결과 그룹
   */
  testApiSecurity: async (): Promise<TestGroup> => {
    const group: TestGroup = {
      name: 'API 보안 유틸리티',
      results: [],
      passCount: 0,
      failCount: 0
    };
    
    try {
      // 요청 속도 제한 테스트
      const rateLimitKey = 'test_api';
      const limitPassed = RateLimiter.checkLimit(rateLimitKey, 3, 10000) === true;
      
      group.results.push({
        name: '요청 속도 제한',
        passed: limitPassed,
        message: limitPassed ? '성공' : '실패: 요청 속도 제한이 올바르게 작동하지 않습니다.'
      });
      
      if (limitPassed) group.passCount++; else group.failCount++;
      
      // 여러 요청 후 속도 제한 확인
      RateLimiter.checkLimit(rateLimitKey, 3, 10000);
      RateLimiter.checkLimit(rateLimitKey, 3, 10000);
      RateLimiter.checkLimit(rateLimitKey, 3, 10000);
      
      const rateLimitExceededPassed = RateLimiter.checkLimit(rateLimitKey, 3, 10000) === false;
      
      group.results.push({
        name: '요청 속도 제한 초과',
        passed: rateLimitExceededPassed,
        message: rateLimitExceededPassed ? '성공' : '실패: 요청 속도 제한 초과가 올바르게 감지되지 않습니다.'
      });
      
      if (rateLimitExceededPassed) group.passCount++; else group.failCount++;
      
      // 대기 시간 계산 테스트
      const waitTime = RateLimiter.getWaitTime(rateLimitKey, 3, 10000);
      const waitTimePassed = waitTime > 0;
      
      group.results.push({
        name: '대기 시간 계산',
        passed: waitTimePassed,
        message: waitTimePassed ? '성공' : '실패: 대기 시간 계산이 올바르게 작동하지 않습니다.'
      });
      
      if (waitTimePassed) group.passCount++; else group.failCount++;
      
      // 제한 상태 초기화 테스트
      RateLimiter.resetLimit(rateLimitKey);
      const resetPassed = RateLimiter.checkLimit(rateLimitKey, 3, 10000) === true;
      
      group.results.push({
        name: '제한 상태 초기화',
        passed: resetPassed,
        message: resetPassed ? '성공' : '실패: 제한 상태 초기화가 올바르게 작동하지 않습니다.'
      });
      
      if (resetPassed) group.passCount++; else group.failCount++;
      
      // API 캐시 테스트
      const cacheKey = 'test_cache';
      const cacheData = { test: 'data' };
      
      ApiCache.set(cacheKey, cacheData, 10000);
      const cachedData = ApiCache.get(cacheKey);
      
      const cachePassed = cachedData !== null && cachedData.test === 'data';
      
      group.results.push({
        name: 'API 캐시',
        passed: cachePassed,
        message: cachePassed ? '성공' : '실패: API 캐시가 올바르게 작동하지 않습니다.'
      });
      
      if (cachePassed) group.passCount++; else group.failCount++;
      
      // 캐시 무효화 테스트
      ApiCache.invalidate(cacheKey);
      const invalidatedCache = ApiCache.get(cacheKey);
      
      const invalidationPassed = invalidatedCache === null;
      
      group.results.push({
        name: '캐시 무효화',
        passed: invalidationPassed,
        message: invalidationPassed ? '성공' : '실패: 캐시 무효화가 올바르게 작동하지 않습니다.'
      });
      
      if (invalidationPassed) group.passCount++; else group.failCount++;
    } catch (error) {
      console.error('API 보안 유틸리티 테스트 중 오류 발생:', error);
      
      group.results.push({
        name: 'API 보안 유틸리티 예외 처리',
        passed: false,
        message: `실패: 테스트 중 예외 발생 - ${error}`
      });
      
      group.failCount++;
    }
    
    return group;
  }
};

/**
 * 보안 취약점 검사 도구
 */
export const VulnerabilityScanner = {
  /**
   * XSS 취약점 검사
   * @param html 검사할 HTML 문자열
   * @returns 취약점 결과
   */
  checkXSS: (html: string): TestResult => {
    const vulnerablePatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
      /javascript\s*:/i,
      /on\w+\s*=/i,
      /data\s*:/i
    ];
    
    const sanitized = Sanitizer.sanitizeHtml(html);
    
    let isVulnerable = false;
    let foundPattern = '';
    
    for (const pattern of vulnerablePatterns) {
      if (pattern.test(html) && !pattern.test(sanitized)) {
        isVulnerable = true;
        foundPattern = pattern.toString();
        break;
      }
    }
    
    return {
      name: 'XSS 취약점 검사',
      passed: !isVulnerable,
      message: isVulnerable 
        ? `취약: 잠재적인 XSS 패턴 발견 (${foundPattern}). 살균 처리 후 제거됨.`
        : '안전: XSS 취약점 없음.'
    };
  },
  
  /**
   * SQL 인젝션 취약점 검사
   * @param query 검사할 쿼리 문자열
   * @returns 취약점 결과
   */
  checkSQLInjection: (query: string): TestResult => {
    const vulnerablePatterns = [
      /'\s*OR\s*'1'\s*=\s*'1/i,
      /'\s*OR\s*1\s*=\s*1/i,
      /'\s*;\s*DROP\s+TABLE/i,
      /'\s*;\s*DELETE\s+FROM/i,
      /'\s*UNION\s+SELECT/i,
      /'\s*;\s*SELECT/i
    ];
    
    let isVulnerable = false;
    let foundPattern = '';
    
    for (const pattern of vulnerablePatterns) {
      if (pattern.test(query)) {
        isVulnerable = true;
        foundPattern = pattern.toString();
        break;
      }
    }
    
    return {
      name: 'SQL 인젝션 취약점 검사',
      passed: !isVulnerable,
      message: isVulnerable 
        ? `취약: 잠재적인 SQL 인젝션 패턴 발견 (${foundPattern}).`
        : '안전: SQL 인젝션 취약점 없음.'
    };
  },
  
  /**
   * CSRF 취약점 검사
   * @param formHtml 검사할 폼 HTML
   * @returns 취약점 결과
   */
  checkCSRF: (formHtml: string): TestResult => {
    const hasCSRFToken = formHtml.includes('_csrf') || 
                        formHtml.includes('csrf_token') || 
                        formHtml.includes('X-CSRF-Token');
    
    return {
      name: 'CSRF 취약점 검사',
      passed: hasCSRFToken,
      message: hasCSRFToken 
        ? '안전: CSRF 토큰이 발견되었습니다.'
        : '취약: CSRF 토큰이 발견되지 않았습니다. 폼에 CSRFTokenField를 추가하세요.'
    };
  },
  
  /**
   * 암호화 취약점 검사
   * @param encryptedText 검사할 암호화된 문자열
   * @param originalText 원본 문자열
   * @returns 취약점 결과
   */
  checkEncryption: (encryptedText: string, originalText: string): TestResult => {
    const isEncrypted = encryptedText !== originalText && encryptedText.length > originalText.length;
    
    return {
      name: '암호화 취약점 검사',
      passed: isEncrypted,
      message: isEncrypted 
        ? '안전: 데이터가 올바르게 암호화되었습니다.'
        : '취약: 데이터가 암호화되지 않았거나 약한 암호화가 사용되었습니다.'
    };
  },
  
  /**
   * 입력 검증 취약점 검사
   * @param input 검사할 입력값
   * @param inputType 입력 타입 ('email', 'url', 'password')
   * @returns 취약점 결과
   */
  checkInputValidation: (input: string, inputType: 'email' | 'url' | 'password'): TestResult => {
    let isValid = false;
    
    switch (inputType) {
      case 'email':
        isValid = InputValidator.isValidEmail(input);
        break;
      case 'url':
        isValid = InputValidator.isValidUrl(input);
        break;
      case 'password':
        isValid = InputValidator.getPasswordStrength(input) >= 2;
        break;
    }
    
    return {
      name: `${inputType} 입력 검증 취약점 검사`,
      passed: isValid,
      message: isValid 
        ? `안전: ${inputType} 입력값이 유효합니다.`
        : `취약: 유효하지 않은 ${inputType} 입력값이 발견되었습니다.`
    };
  },
  
  /**
   * 보안 헤더 취약점 검사
   * @param headers 검사할 헤더 객체
   * @returns 취약점 결과
   */
  checkSecurityHeaders: (headers: Record<string, string>): TestResult[] => {
    const results: TestResult[] = [];
    
    // Content-Security-Policy 검사
    results.push({
      name: 'Content-Security-Policy 검사',
      passed: !!headers['Content-Security-Policy'],
      message: headers['Content-Security-Policy'] 
        ? '안전: Content-Security-Policy 헤더가 설정되어 있습니다.'
        : '취약: Content-Security-Policy 헤더가 설정되어 있지 않습니다.'
    });
    
    // X-XSS-Protection 검사
    results.push({
      name: 'X-XSS-Protection 검사',
      passed: headers['X-XSS-Protection'] === '1; mode=block',
      message: headers['X-XSS-Protection'] === '1; mode=block'
        ? '안전: X-XSS-Protection 헤더가 올바르게 설정되어 있습니다.'
        : '취약: X-XSS-Protection 헤더가 설정되어 있지 않거나 올바르지 않습니다.'
    });
    
    // X-Content-Type-Options 검사
    results.push({
      name: 'X-Content-Type-Options 검사',
      passed: headers['X-Content-Type-Options'] === 'nosniff',
      message: headers['X-Content-Type-Options'] === 'nosniff'
        ? '안전: X-Content-Type-Options 헤더가 올바르게 설정되어 있습니다.'
        : '취약: X-Content-Type-Options 헤더가 설정되어 있지 않거나 올바르지 않습니다.'
    });
    
    // X-Frame-Options 검사
    results.push({
      name: 'X-Frame-Options 검사',
      passed: !!headers['X-Frame-Options'],
      message: headers['X-Frame-Options']
        ? `안전: X-Frame-Options 헤더가 설정되어 있습니다. (${headers['X-Frame-Options']})`
        : '취약: X-Frame-Options 헤더가 설정되어 있지 않습니다.'
    });
    
    // Strict-Transport-Security 검사
    results.push({
      name: 'Strict-Transport-Security 검사',
      passed: !!headers['Strict-Transport-Security'],
      message: headers['Strict-Transport-Security']
        ? '안전: Strict-Transport-Security 헤더가 설정되어 있습니다.'
        : '취약: Strict-Transport-Security 헤더가 설정되어 있지 않습니다.'
    });
    
    return results;
  }
}; 