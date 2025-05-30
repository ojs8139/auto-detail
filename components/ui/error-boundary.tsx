"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, ErrorCode, ErrorSeverity, ErrorSource } from '@/lib/error/types';
import { handleError } from '@/lib/error/handler';
import { Button } from './button';
import { AlertTriangle, Info, XCircle, AlertOctagon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { cn } from '@/lib/utils';

/**
 * ErrorBoundary 속성 정의
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * ErrorBoundary 상태 정의
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * React ErrorBoundary 컴포넌트
 * 컴포넌트 트리에서 발생한 JavaScript 에러를 캐치하고 폴백 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  /**
   * 자식 컴포넌트에서 에러가 발생하면 호출됩니다.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트합니다.
    return { hasError: true, error };
  }

  /**
   * 에러 발생 시 로깅을 위해 사용됩니다.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 에러 처리 로직
    const appError = error instanceof AppError
      ? error
      : new AppError({
          message: error.message,
          code: ErrorCode.UNKNOWN_ERROR,
          severity: ErrorSeverity.ERROR,
          source: ErrorSource.CLIENT,
          context: {
            component: this.constructor.name,
            componentStack: errorInfo.componentStack || undefined,
          },
          cause: error,
        });

    // 에러 핸들러를 통해 에러 처리
    handleError(appError);

    // 부모 컴포넌트에 에러 정보 전달
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * 에러 상태를 초기화합니다.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // 사용자 정의 fallback이 함수인 경우
      if (fallback && typeof fallback === 'function') {
        return fallback(error, this.resetError);
      }

      // 사용자 정의 fallback이 ReactNode인 경우
      if (fallback) {
        return fallback;
      }

      // 기본 폴백 UI
      return (
        <DefaultErrorFallback
          error={error}
          resetError={this.resetError}
        />
      );
    }

    // 에러가 없으면 자식 컴포넌트 렌더링
    return children;
  }
}

/**
 * 기본 에러 폴백 컴포넌트 속성
 */
interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * 기본 에러 폴백 컴포넌트
 */
function DefaultErrorFallback({ error, resetError }: DefaultErrorFallbackProps): React.ReactElement {
  // AppError 인스턴스인지 확인
  const appError = error instanceof AppError
    ? error
    : new AppError({ message: error.message });

  // 심각도에 따른 스타일 및 아이콘 설정
  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return {
          variant: 'default',
          icon: Info,
          iconClasses: 'text-blue-500',
          title: '알림'
        };
      case ErrorSeverity.WARNING:
        return {
          variant: 'default',
          icon: AlertTriangle,
          iconClasses: 'text-amber-500',
          title: '주의'
        };
      case ErrorSeverity.ERROR:
        return {
          variant: 'destructive',
          icon: XCircle,
          iconClasses: 'text-red-500',
          title: '오류'
        };
      case ErrorSeverity.CRITICAL:
        return {
          variant: 'destructive',
          icon: AlertOctagon,
          iconClasses: 'text-red-600',
          title: '심각한 오류'
        };
      default:
        return {
          variant: 'destructive',
          icon: XCircle,
          iconClasses: 'text-red-500',
          title: '오류'
        };
    }
  };

  const { variant, icon: Icon, iconClasses, title } = getSeverityStyles(appError.severity);

  return (
    <Alert variant={variant as "default" | "destructive"} className="my-4">
      <Icon className={cn('h-5 w-5', iconClasses)} />
      <AlertTitle className="flex items-center gap-2">
        {title}
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded">
            {appError.code}
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p>{appError.userFacingMessage}</p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs font-mono p-2 bg-black/5 dark:bg-white/5 rounded overflow-auto max-h-[200px]">
            {appError.message}
            {appError.stack && (
              <pre className="mt-2 text-[10px] opacity-70 whitespace-pre-wrap">
                {appError.stack.split('\n').slice(1).join('\n')}
              </pre>
            )}
          </div>
        )}
        
        {appError.suggestions && appError.suggestions.length > 0 && (
          <div className="text-sm mt-2">
            <p className="font-medium">해결 방법:</p>
            <ul className="list-disc pl-5 mt-1">
              {appError.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={resetError}
          >
            다시 시도
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
} 