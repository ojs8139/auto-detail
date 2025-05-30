/**
 * API 에러 처리 미들웨어
 * API 경로에서 발생하는 에러를 일관되게 처리합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AppError, ErrorCode } from '@/lib/error/types';
import { handleError, createApiErrorResponse } from '@/lib/error/handler';
import { logger } from '@/lib/error/logger';

/**
 * API 핸들러 타입 정의
 */
export type ApiHandler = (req: NextRequest, params?: any) => Promise<NextResponse>;

/**
 * API 에러 처리 미들웨어
 * API 핸들러를 감싸서 에러를 처리합니다.
 * 
 * @param handler API 핸들러 함수
 * @returns 에러 처리가 추가된 API 핸들러 함수
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, params?: any) => {
    try {
      // 요청 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('API 요청 시작', {
          url: req.url,
          method: req.method,
          params: params || {},
        });
      }

      // 원래 핸들러 실행
      const response = await handler(req, params);
      
      // 성공 응답 로깅 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        logger.debug('API 요청 성공', {
          url: req.url,
          method: req.method,
          status: response.status,
        });
      }
      
      return response;
    } catch (error) {
      // 에러 처리
      const appError = error instanceof AppError
        ? error
        : new AppError({
            message: error instanceof Error ? error.message : '알 수 없는 서버 오류',
            code: ErrorCode.API_ERROR,
            cause: error instanceof Error ? error : undefined,
          });
      
      // 에러 로깅
      handleError(appError, {
        url: req.url,
        method: req.method,
        params: params || {},
      });
      
      // API 에러 응답 생성
      const errorResponse = createApiErrorResponse(appError);
      
      // JSON 형식으로 에러 반환
      return NextResponse.json(
        { 
          error: errorResponse.message,
          code: errorResponse.code,
          ...(process.env.NODE_ENV === 'development' 
            ? { details: errorResponse.details }
            : {})
        },
        { status: errorResponse.status }
      );
    }
  };
}

/**
 * 유효성 검사 유틸리티
 * API 요청 본문이나 쿼리 파라미터 등의 유효성을 검사합니다.
 * 
 * @param condition 유효성 검사 조건
 * @param message 에러 메시지
 * @param code 에러 코드
 * @throws 조건이 충족되지 않으면 AppError를 발생시킵니다.
 */
export function validateApiRequest(
  condition: boolean,
  message: string = '잘못된 요청입니다',
  code: ErrorCode = ErrorCode.VALIDATION_ERROR
): void {
  if (!condition) {
    throw new AppError({
      message,
      code,
      userFacingMessage: message,
    });
  }
}

/**
 * API 요청 본문 파싱 유틸리티
 * 
 * @param req 요청 객체
 * @returns 파싱된 JSON 본문
 * @throws 본문이 유효한 JSON이 아니면 AppError를 발생시킵니다.
 */
export async function parseRequestBody(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch (error) {
    throw new AppError({
      message: 'JSON 본문 파싱 오류',
      code: ErrorCode.VALIDATION_ERROR,
      userFacingMessage: '요청 본문이 유효한 JSON 형식이 아닙니다',
      cause: error instanceof Error ? error : undefined,
    });
  }
} 