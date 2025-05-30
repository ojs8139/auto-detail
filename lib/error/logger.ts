/**
 * 애플리케이션 로깅 시스템
 * 애플리케이션 전반의 로그와 에러를 기록하는 유틸리티를 제공합니다.
 */

import { ErrorLogInfo, ErrorSeverity, ErrorSource } from './types';

/**
 * 로그 레벨 정의
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 로그 엔트리 인터페이스
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  source?: string;
  context?: Record<string, any>;
}

/**
 * 로그 스토리지 인터페이스
 */
export interface LogStorage {
  save(entry: LogEntry): void;
  getLogs(count?: number): LogEntry[];
  clear(): void;
}

/**
 * 메모리 기반 로그 스토리지 구현
 */
class MemoryLogStorage implements LogStorage {
  private logs: LogEntry[] = [];
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  save(entry: LogEntry): void {
    this.logs.push(entry);
    
    // 최대 크기를 초과하면 가장 오래된 로그 제거
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }
  }
  
  getLogs(count?: number): LogEntry[] {
    if (count) {
      return this.logs.slice(-count);
    }
    return [...this.logs];
  }
  
  clear(): void {
    this.logs = [];
  }
}

/**
 * 로컬 스토리지 기반 로그 스토리지 구현
 */
class LocalStorageLogStorage implements LogStorage {
  private key: string;
  private maxSize: number;
  
  constructor(key: string = 'app_logs', maxSize: number = 100) {
    this.key = key;
    this.maxSize = maxSize;
  }
  
  save(entry: LogEntry): void {
    if (typeof window === 'undefined') return;
    
    try {
      const logs = this.getLogs();
      logs.push(entry);
      
      // 최대 크기를 초과하면 가장 오래된 로그 제거
      if (logs.length > this.maxSize) {
        logs.shift();
      }
      
      localStorage.setItem(this.key, JSON.stringify(logs));
    } catch (error) {
      console.error('로그 저장 오류:', error);
    }
  }
  
  getLogs(count?: number): LogEntry[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const logsJson = localStorage.getItem(this.key);
      const logs: LogEntry[] = logsJson ? JSON.parse(logsJson) : [];
      
      if (count) {
        return logs.slice(-count);
      }
      return logs;
    } catch (error) {
      console.error('로그 조회 오류:', error);
      return [];
    }
  }
  
  clear(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(this.key);
    } catch (error) {
      console.error('로그 삭제 오류:', error);
    }
  }
}

/**
 * 로그 핸들러 인터페이스
 */
export interface LogHandler {
  handle(entry: LogEntry): void;
}

/**
 * 콘솔 로그 핸들러 구현
 */
class ConsoleLogHandler implements LogHandler {
  handle(entry: LogEntry): void {
    const { level, message, source, context } = entry;
    const timestamp = new Date(entry.timestamp).toISOString();
    const sourceInfo = source ? `[${source}]` : '';
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${timestamp} ${sourceInfo} ${message}`, context || '');
        break;
      case LogLevel.INFO:
        console.info(`${timestamp} ${sourceInfo} ${message}`, context || '');
        break;
      case LogLevel.WARN:
        console.warn(`${timestamp} ${sourceInfo} ${message}`, context || '');
        break;
      case LogLevel.ERROR:
        console.error(`${timestamp} ${sourceInfo} ${message}`, context || '');
        break;
      default:
        console.log(`${timestamp} ${sourceInfo} ${message}`, context || '');
    }
  }
}

/**
 * 원격 로그 핸들러 인터페이스
 */
export interface RemoteLogOptions {
  url: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * 원격 로그 핸들러 구현
 */
class RemoteLogHandler implements LogHandler {
  private options: RemoteLogOptions;
  private queue: LogEntry[] = [];
  private timerId: NodeJS.Timeout | null = null;
  
  constructor(options: RemoteLogOptions) {
    this.options = {
      batchSize: 10,
      flushInterval: 30000, // 30초
      ...options
    };
    
    // 주기적으로 로그 전송
    if (typeof window !== 'undefined') {
      this.timerId = setInterval(() => this.flush(), this.options.flushInterval);
    }
  }
  
  handle(entry: LogEntry): void {
    this.queue.push(entry);
    
    // 배치 크기에 도달하면 즉시 전송
    if (this.queue.length >= (this.options.batchSize || 10)) {
      this.flush();
    }
  }
  
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    
    const logs = [...this.queue];
    this.queue = [];
    
    try {
      await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.options.headers
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('원격 로그 전송 오류:', error);
      // 실패한 로그는 다시 큐에 추가
      this.queue = [...this.queue, ...logs];
    }
  }
  
  dispose(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * Logger 클래스
 */
class Logger {
  private static instance: Logger;
  private storage: LogStorage;
  private handlers: LogHandler[] = [];
  private remoteHandler: RemoteLogHandler | null = null;
  private minLevel: LogLevel = LogLevel.INFO;
  
  private constructor() {
    // 기본 스토리지 및 핸들러 설정
    this.storage = typeof window !== 'undefined' 
      ? new LocalStorageLogStorage()
      : new MemoryLogStorage();
    
    this.handlers.push(new ConsoleLogHandler());
  }
  
  /**
   * Logger 인스턴스 가져오기
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * 로그 레벨 설정
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }
  
  /**
   * 로그 스토리지 설정
   */
  setStorage(storage: LogStorage): void {
    this.storage = storage;
  }
  
  /**
   * 로그 핸들러 추가
   */
  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * 원격 로그 핸들러 설정
   */
  setRemoteLogger(options: RemoteLogOptions): void {
    if (this.remoteHandler) {
      this.remoteHandler.dispose();
      this.handlers = this.handlers.filter(h => h !== this.remoteHandler);
    }
    
    this.remoteHandler = new RemoteLogHandler(options);
    this.handlers.push(this.remoteHandler);
  }
  
  /**
   * 로그 기록
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, source?: string): void {
    // 최소 로그 레벨 확인
    if (!this.shouldLog(level)) return;
    
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      source,
      context,
    };
    
    // 스토리지에 저장
    this.storage.save(entry);
    
    // 핸들러에 전달
    this.handlers.forEach(handler => {
      try {
        handler.handle(entry);
      } catch (error) {
        console.error('로그 핸들러 오류:', error);
      }
    });
  }
  
  /**
   * 로그 레벨 확인
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
  
  /**
   * 디버그 로그
   */
  debug(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }
  
  /**
   * 정보 로그
   */
  info(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.INFO, message, context, source);
  }
  
  /**
   * 경고 로그
   */
  warn(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.WARN, message, context, source);
  }
  
  /**
   * 에러 로그
   */
  error(message: string, context?: Record<string, any>, source?: string): void {
    this.log(LogLevel.ERROR, message, context, source);
  }
  
  /**
   * 에러 객체 로깅
   */
  logError(error: Error | ErrorLogInfo, source?: string): void {
    if ('code' in error) {
      // ErrorLogInfo 형태
      const { code, message, severity, source: errorSource, context } = error;
      
      this.log(
        this.mapSeverityToLogLevel(severity),
        `[${code}] ${message}`,
        context,
        source || errorSource
      );
    } else {
      // 일반 Error 객체
      this.log(
        LogLevel.ERROR,
        error.message,
        { stack: error.stack },
        source
      );
    }
  }
  
  /**
   * ErrorSeverity를 LogLevel로 변환
   */
  private mapSeverityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.INFO:
        return LogLevel.INFO;
      case ErrorSeverity.WARNING:
        return LogLevel.WARN;
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return LogLevel.ERROR;
      default:
        return LogLevel.ERROR;
    }
  }
  
  /**
   * 로그 가져오기
   */
  getLogs(count?: number): LogEntry[] {
    return this.storage.getLogs(count);
  }
  
  /**
   * 로그 내보내기
   */
  exportLogs(): string {
    const logs = this.storage.getLogs();
    return JSON.stringify(logs, null, 2);
  }
  
  /**
   * 로그 지우기
   */
  clearLogs(): void {
    this.storage.clear();
  }
}

// Logger 인스턴스 생성
export const logger = Logger.getInstance();

// 개발 환경에서는 디버그 로그 활성화
if (process.env.NODE_ENV === 'development') {
  logger.setMinLevel(LogLevel.DEBUG);
}

// 글로벌 에러 핸들러
export const handleGlobalError = (error: Error, errorInfo?: React.ErrorInfo): void => {
  logger.error('글로벌 에러 발생', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
  });
}; 