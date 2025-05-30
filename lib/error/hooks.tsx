"use client";

/**
 * 에러 처리를 위한 React 훅과 컨텍스트
 * 클라이언트 측에서 에러를 처리하고 표시하기 위한 유틸리티를 제공합니다.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { AppError, ErrorCode, ErrorSeverity, UserFacingError } from './types';
import { handleError } from './handler';
import { AlertTriangle, Info, XCircle, AlertOctagon } from 'lucide-react';

/**
 * 에러 핸들러 컨텍스트 인터페이스
 */
interface ErrorHandlerContextProps {
  setError: (error: Error | AppError) => void;
  clearError: () => void;
  currentError: Error | AppError | null;
  showErrorToast: (error: Error | AppError | string) => void;
}

/**
 * 에러 핸들러 컨텍스트 생성
 */
const ErrorHandlerContext = createContext<ErrorHandlerContextProps>({
  setError: () => {},
  clearError: () => {},
  currentError: null,
  showErrorToast: () => {},
});

/**
 * 에러 핸들러 프로바이더 속성
 */
interface ErrorHandlerProviderProps {
  children: ReactNode;
}

/**
 * 에러 핸들러 프로바이더 컴포넌트
 */
export function ErrorHandlerProvider({ children }: ErrorHandlerProviderProps): React.ReactElement {
  const [currentError, setCurrentError] = useState<Error | AppError | null>(null);
  const { toast } = useToast();
  
  /**
   * 에러 설정 함수
   */
  const setError = useCallback((error: Error | AppError) => {
    // AppError가 아닌 경우 변환
    const appError = error instanceof AppError
      ? error
      : new AppError({
          message: error.message,
          code: ErrorCode.UNKNOWN_ERROR,
          cause: error,
        });
    
    // 에러 핸들러를 통해 에러 처리
    handleError(appError);
    
    // 상태 업데이트
    setCurrentError(appError);
  }, []);
  
  /**
   * 에러 초기화 함수
   */
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);
  
  /**
   * 에러 Toast 표시 함수
   */
  const showErrorToast = useCallback((error: Error | AppError | string) => {
    // 에러 객체 생성
    const appError = typeof error === 'string'
      ? new AppError({ message: error })
      : error instanceof AppError
        ? error
        : new AppError({
            message: error.message,
            code: ErrorCode.UNKNOWN_ERROR,
            cause: error,
          });
    
    // 심각도에 따른 아이콘 설정
    const getIconBySeverity = (severity: ErrorSeverity) => {
      switch (severity) {
        case ErrorSeverity.INFO:
          return <Info className="h-5 w-5 text-blue-500" />;
        case ErrorSeverity.WARNING:
          return <AlertTriangle className="h-5 w-5 text-amber-500" />;
        case ErrorSeverity.ERROR:
          return <XCircle className="h-5 w-5 text-red-500" />;
        case ErrorSeverity.CRITICAL:
          return <AlertOctagon className="h-5 w-5 text-red-600" />;
        default:
          return <XCircle className="h-5 w-5 text-red-500" />;
      }
    };
    
    // 심각도에 따른 타입 설정
    const getVariantBySeverity = (severity: ErrorSeverity) => {
      switch (severity) {
        case ErrorSeverity.INFO:
          return 'default';
        case ErrorSeverity.WARNING:
          return 'warning';
        case ErrorSeverity.ERROR:
        case ErrorSeverity.CRITICAL:
          return 'destructive';
        default:
          return 'destructive';
      }
    };
    
    // 심각도에 따른 제목 설정
    const getTitleBySeverity = (severity: ErrorSeverity) => {
      switch (severity) {
        case ErrorSeverity.INFO:
          return '알림';
        case ErrorSeverity.WARNING:
          return '주의';
        case ErrorSeverity.ERROR:
          return '오류';
        case ErrorSeverity.CRITICAL:
          return '심각한 오류';
        default:
          return '오류';
      }
    };
    
    // 토스트 표시
    toast({
      variant: getVariantBySeverity(appError.severity) as any,
      title: getTitleBySeverity(appError.severity),
      description: (
        <div className="flex items-center">
          {getIconBySeverity(appError.severity)}
          <span className="ml-2">{appError.userFacingMessage}</span>
        </div>
      )
    });
    
    // 에러 처리 (로깅 등)
    handleError(appError);
  }, [toast]);
  
  return (
    <ErrorHandlerContext.Provider
      value={{
        setError,
        clearError,
        currentError,
        showErrorToast,
      }}
    >
      {children}
    </ErrorHandlerContext.Provider>
  );
}

/**
 * 에러 핸들러 컨텍스트 사용 훅
 */
export function useErrorHandler(): ErrorHandlerContextProps {
  const context = useContext(ErrorHandlerContext);
  
  if (context === undefined) {
    throw new Error('useErrorHandler must be used within an ErrorHandlerProvider');
  }
  
  return context;
}

/**
 * 비동기 함수 에러 래핑 훅
 */
export function useAsyncError<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options?: {
    onError?: (error: Error) => void;
    showToast?: boolean;
  }
): [(...args: any[]) => Promise<T | undefined>, boolean, Error | null] {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { showErrorToast } = useErrorHandler();
  
  const wrappedFn = useCallback(
    async (...args: any[]) => {
      try {
        setLoading(true);
        setError(null);
        return await asyncFn(...args);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        // 에러 토스트 표시 옵션이 true인 경우
        if (options?.showToast !== false) {
          showErrorToast(error);
        }
        
        // 콜백 호출
        if (options?.onError) {
          options.onError(error);
        }
        
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn, options, showErrorToast]
  );
  
  return [wrappedFn, loading, error];
}

/**
 * API 호출 에러 처리 훅
 */
export function useApiErrorHandler() {
  const { showErrorToast } = useErrorHandler();
  
  const handleApiError = useCallback(
    (error: any) => {
      // API 응답 에러인 경우
      if (error?.response?.data?.error) {
        showErrorToast(error.response.data.error);
        return;
      }
      
      // 일반 에러인 경우
      showErrorToast(error instanceof Error ? error : new Error(String(error)));
    },
    [showErrorToast]
  );
  
  return handleApiError;
} 