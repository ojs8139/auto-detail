"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { logger, handleGlobalError } from "@/lib/error/logger"
import { ErrorHandlerProvider } from "@/lib/error/hooks"
import { ApiKeyInitializer } from "@/components/api-key-initializer"

// 전역 오류 핸들러 등록
if (typeof window !== 'undefined') {
  window.onerror = (message, source, lineno, colno, error) => {
    handleGlobalError(error || new Error(String(message)));
    // 기본 처리도 유지
    return false;
  };
  
  window.onunhandledrejection = (event) => {
    handleGlobalError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  };
}

export function Providers({ children, ...props }: ThemeProviderProps) {
  // 개발 환경에서만 실행되는 디버그 로그
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('애플리케이션이 초기화되었습니다.', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ErrorHandlerProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          {...props}
        >
          <ApiKeyInitializer />
          {children}
          <Toaster />
        </NextThemesProvider>
      </ErrorHandlerProvider>
    </ErrorBoundary>
  )
} 