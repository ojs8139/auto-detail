/**
 * 에러 처리를 위한 타입 정의
 * 애플리케이션에서 사용되는 다양한 에러 타입과 인터페이스를 정의합니다.
 */

/**
 * 에러 심각도 레벨 정의
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * 에러 소스 정의
 */
export enum ErrorSource {
  CLIENT = 'client',
  SERVER = 'server',
  API = 'api',
  DATABASE = 'database',
  EXTERNAL = 'external',
}

/**
 * 에러 코드 정의
 */
export enum ErrorCode {
  // 일반 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // API 관련 에러
  API_ERROR = 'API_ERROR',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  
  // 데이터 관련 에러
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  DATA_SAVE_ERROR = 'DATA_SAVE_ERROR',
  DATA_DELETE_ERROR = 'DATA_DELETE_ERROR',
  
  // 외부 서비스 에러
  OPENAI_ERROR = 'OPENAI_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  
  // 기능 관련 에러
  IMAGE_PROCESSING_ERROR = 'IMAGE_PROCESSING_ERROR',
  STYLE_ANALYSIS_ERROR = 'STYLE_ANALYSIS_ERROR',
  TEXT_GENERATION_ERROR = 'TEXT_GENERATION_ERROR',
  EXPORT_ERROR = 'EXPORT_ERROR',
}

/**
 * 에러 컨텍스트 인터페이스
 */
export interface ErrorContext {
  url?: string;
  component?: string;
  action?: string;
  input?: Record<string, any>;
  additionalInfo?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  status?: number;
  method?: string;
  responseData?: any;
  componentStack?: string;
  params?: any;
}

/**
 * 로깅을 위한 에러 정보 인터페이스
 */
export interface ErrorLogInfo {
  code: ErrorCode;
  message: string;
  severity: ErrorSeverity;
  source: ErrorSource;
  stack?: string;
  context?: ErrorContext;
  originalError?: Error;
}

/**
 * 사용자에게 표시할 에러 정보 인터페이스
 */
export interface UserFacingError {
  title: string;
  message: string;
  code: string;
  severity: ErrorSeverity;
  suggestions?: string[];
  actionable?: boolean;
  actionText?: string;
  actionHandler?: () => void;
}

/**
 * 애플리케이션 에러 클래스
 */
export class AppError extends Error {
  code: ErrorCode;
  severity: ErrorSeverity;
  source: ErrorSource;
  context?: ErrorContext;
  userFacingMessage: string;
  suggestions: string[];
  
  constructor({
    message,
    code = ErrorCode.UNKNOWN_ERROR,
    severity = ErrorSeverity.ERROR,
    source = ErrorSource.CLIENT,
    context,
    userFacingMessage,
    suggestions = [],
    cause,
  }: {
    message: string;
    code?: ErrorCode;
    severity?: ErrorSeverity;
    source?: ErrorSource;
    context?: ErrorContext;
    userFacingMessage?: string;
    suggestions?: string[];
    cause?: Error;
  }) {
    super(message, { cause });
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.source = source;
    this.context = {
      ...context,
      timestamp: Date.now(),
    };
    this.userFacingMessage = userFacingMessage || '요청을 처리하는 중 오류가 발생했습니다.';
    this.suggestions = suggestions;
  }
  
  /**
   * 로깅을 위한 정보 생성
   */
  toLogInfo(): ErrorLogInfo {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      source: this.source,
      stack: this.stack,
      context: this.context,
      originalError: this.cause as Error,
    };
  }
  
  /**
   * 사용자에게 표시할 에러 정보 생성
   */
  toUserFacingError(): UserFacingError {
    return {
      title: this.getUserFacingTitle(),
      message: this.userFacingMessage,
      code: this.code,
      severity: this.severity,
      suggestions: this.suggestions,
    };
  }
  
  /**
   * 사용자에게 표시할 제목 생성
   */
  private getUserFacingTitle(): string {
    switch (this.severity) {
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
  }
} 