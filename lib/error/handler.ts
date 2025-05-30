/**
 * 에러 핸들러 모듈
 * 애플리케이션 전반의 에러를 처리하는 함수와 유틸리티를 제공합니다.
 */

import { AppError, ErrorCode, ErrorContext, ErrorSeverity, ErrorSource } from './types';
import { logger } from './logger';

/**
 * API 에러 응답 인터페이스
 */
export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * 에러 처리 함수 타입
 */
export type ErrorHandler = (error: Error | AppError) => void;

/**
 * 에러 처리 함수 목록
 */
const errorHandlers: ErrorHandler[] = [];

/**
 * 에러 핸들러 등록
 */
export function registerErrorHandler(handler: ErrorHandler): void {
  errorHandlers.push(handler);
}

/**
 * 등록된 에러 핸들러를 통해 에러 처리
 */
export function handleError(error: Error | AppError, context?: ErrorContext): void {
  try {
    // AppError로 변환
    const appError = error instanceof AppError 
      ? error 
      : new AppError({
          message: error.message,
          code: ErrorCode.UNKNOWN_ERROR,
          severity: ErrorSeverity.ERROR,
          source: ErrorSource.CLIENT,
          context,
          cause: error,
        });
    
    // 컨텍스트 병합
    if (context) {
      appError.context = {
        ...appError.context,
        ...context,
      };
    }
    
    // 에러 로깅
    logger.logError(appError.toLogInfo());
    
    // 등록된 모든 핸들러 호출
    errorHandlers.forEach(handler => {
      try {
        handler(appError);
      } catch (handlerError) {
        logger.error('에러 핸들러 실행 중 오류 발생', { 
          error: handlerError, 
          originalError: error 
        });
      }
    });
  } catch (handlingError) {
    // 에러 처리 중 에러 발생
    logger.error('에러 처리 중 오류 발생', { 
      error: handlingError, 
      originalError: error 
    });
    console.error('에러 처리 중 오류 발생:', handlingError);
  }
}

/**
 * API 에러 처리 함수
 */
export function handleApiError(error: Error | any, context?: ErrorContext): AppError {
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else if (error?.response) {
    // Axios 또는 fetch 에러 응답
    const status = error.response.status || 500;
    const responseData = error.response.data;
    
    // API 에러 응답에서 정보 추출
    const code = responseData?.code || ErrorCode.API_ERROR;
    const message = responseData?.message || error.message || '알 수 없는 API 오류';
    
    appError = new AppError({
      message: `API 오류 (${status}): ${message}`,
      code: code as ErrorCode,
      severity: getSeverityFromStatus(status),
      source: ErrorSource.API,
      context: {
        ...context,
        status,
        url: error.config?.url || context?.url,
        method: error.config?.method || context?.method,
        responseData,
      },
      userFacingMessage: getUserMessageFromStatus(status, message),
      cause: error,
    });
  } else {
    // 일반 에러
    appError = new AppError({
      message: error.message || '알 수 없는 에러',
      code: ErrorCode.API_ERROR,
      severity: ErrorSeverity.ERROR,
      source: ErrorSource.API,
      context,
      cause: error,
    });
  }
  
  // 에러 처리
  handleError(appError);
  
  return appError;
}

/**
 * HTTP 상태 코드에 따른 심각도 결정
 */
function getSeverityFromStatus(status: number): ErrorSeverity {
  if (status >= 500) {
    return ErrorSeverity.ERROR;
  } else if (status >= 400) {
    return ErrorSeverity.WARNING;
  } else {
    return ErrorSeverity.INFO;
  }
}

/**
 * HTTP 상태 코드에 따른 사용자 메시지 생성
 */
function getUserMessageFromStatus(status: number, message?: string): string {
  switch (status) {
    case 400:
      return message || '요청이 잘못되었습니다. 입력 내용을 확인해주세요.';
    case 401:
      return '인증이 필요합니다. 다시 로그인해주세요.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 408:
    case 504:
      return '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    case 429:
      return '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.';
    default:
      if (status >= 500) {
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
      return message || '오류가 발생했습니다. 다시 시도해주세요.';
  }
}

/**
 * API 에러 응답 생성
 */
export function createApiErrorResponse(error: Error | AppError): ApiErrorResponse {
  const appError = error instanceof AppError
    ? error
    : new AppError({
        message: error.message,
        code: ErrorCode.UNKNOWN_ERROR,
        cause: error,
      });
  
  let status = 500;
  
  // 에러 코드에 따른 상태 코드 설정
  switch (appError.code) {
    case ErrorCode.VALIDATION_ERROR:
      status = 400;
      break;
    case ErrorCode.UNAUTHORIZED:
      status = 401;
      break;
    case ErrorCode.FORBIDDEN:
      status = 403;
      break;
    case ErrorCode.NOT_FOUND:
      status = 404;
      break;
    case ErrorCode.API_RATE_LIMIT:
      status = 429;
      break;
    default:
      status = appError.severity === ErrorSeverity.CRITICAL ? 500 : 400;
  }
  
  return {
    status,
    code: appError.code,
    message: appError.userFacingMessage,
    details: process.env.NODE_ENV === 'development' 
      ? { originalMessage: appError.message }
      : undefined,
  };
}

/**
 * 에러 재시도 옵션 인터페이스
 */
export interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  backoffFactor: number;
  maxDelay?: number;
  retryableStatusCodes?: number[];
}

/**
 * 기본 재시도 옵션
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 300,
  backoffFactor: 2,
  maxDelay: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * 재시도 가능한 에러인지 확인
 */
export function isRetryableError(error: any, options: Partial<RetryOptions> = {}): boolean {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  if (!error) return false;
  
  // 네트워크 에러는 재시도 가능
  if (error?.message?.includes('Network Error')) return true;
  
  // 타임아웃 에러는 재시도 가능
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) return true;
  
  // 특정 HTTP 상태 코드는 재시도 가능
  const status = error?.response?.status;
  if (status && retryOptions.retryableStatusCodes?.includes(status)) return true;
  
  return false;
}

/**
 * 지수 백오프를 사용한 재시도 지연 계산
 */
export function calculateRetryDelay(retryCount: number, options: Partial<RetryOptions> = {}): number {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  const delay = retryOptions.initialDelay * Math.pow(retryOptions.backoffFactor, retryCount);
  
  // 최대 지연 시간 제한
  return Math.min(delay, retryOptions.maxDelay || Infinity);
}

/**
 * 재시도 함수 타입
 */
export type RetryableFunction<T> = () => Promise<T>;

/**
 * 재시도 로직을 포함한 함수 실행
 */
export async function withRetry<T>(
  fn: RetryableFunction<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | null = null;
  
  for (let retryCount = 0; retryCount <= retryOptions.maxRetries; retryCount++) {
    try {
      if (retryCount > 0) {
        // 첫 번째 시도가 아닌 경우에만 지연
        const delay = calculateRetryDelay(retryCount - 1, retryOptions);
        logger.debug(`API 호출 재시도 ${retryCount}/${retryOptions.maxRetries} (${delay}ms 후)`, {
          error: lastError,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // 재시도 가능한 에러가 아니거나 최대 재시도 횟수에 도달한 경우
      if (!isRetryableError(error, retryOptions) || retryCount === retryOptions.maxRetries) {
        throw error;
      }
      
      logger.warn(`API 호출 실패, 재시도 예정 ${retryCount + 1}/${retryOptions.maxRetries}`, {
        error: lastError,
      });
    }
  }
  
  // 여기까지 오면 모든 재시도가 실패한 것
  throw lastError as Error;
} 