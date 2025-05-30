/**
 * 웹사이트 스크래핑을 위한 API 라우트
 * 클라이언트에서 CORS 문제 없이 외부 웹사이트 데이터에 접근할 수 있도록 합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeSite } from '@/lib/scraper';
import { withErrorHandling, validateApiRequest, parseRequestBody } from '@/lib/api/error-middleware';
import { AppError, ErrorCode } from '@/lib/error/types';

// 캐시를 저장할 객체 (서버 메모리에 임시 저장)
const scrapingCache: Record<string, { data: any, timestamp: number }> = {};
// 캐시 유효 시간 (1시간)
const CACHE_TTL = 60 * 60 * 1000;

/**
 * URL 유효성 검사 함수
 */
function validateUrl(url: string): void {
  // URL 존재 여부 확인
  validateApiRequest(
    !!url, 
    '스크래핑할 URL이 제공되지 않았습니다.', 
    ErrorCode.VALIDATION_ERROR
  );
  
  // URL 형식 검증
  try {
    new URL(url);
  } catch (error) {
    throw new AppError({
      message: '유효하지 않은 URL 형식입니다.',
      code: ErrorCode.VALIDATION_ERROR,
      userFacingMessage: '유효하지 않은 URL 형식입니다.',
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * 캐시 확인 및 스크래핑 실행 함수
 */
async function getScrapingResult(url: string, skipCache: boolean = false): Promise<any> {
  // 캐시 확인 (skipCache가 true가 아니고 캐시가 유효한 경우)
  const now = Date.now();
  if (!skipCache && scrapingCache[url] && (now - scrapingCache[url].timestamp) < CACHE_TTL) {
    return {
      ...scrapingCache[url].data,
      fromCache: true
    };
  }

  // 스크래핑 실행
  try {
    const scrapingResult = await scrapeSite(url);

    // 결과 캐싱
    scrapingCache[url] = {
      data: scrapingResult,
      timestamp: now
    };

    // 결과 반환
    return {
      ...scrapingResult,
      fromCache: false
    };
  } catch (error) {
    throw new AppError({
      message: `스크래핑 처리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      code: ErrorCode.API_ERROR,
      userFacingMessage: '웹사이트 스크래핑 중 오류가 발생했습니다. 유효한 URL인지 확인하고 다시 시도해주세요.',
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * GET 요청 처리 - 스크래핑 결과 반환
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url') || '';
  const skipCache = searchParams.get('skipCache') === 'true';

  // URL 유효성 검사
  validateUrl(url);

  // 스크래핑 실행
  const result = await getScrapingResult(url, skipCache);

  return NextResponse.json(result);
});

/**
 * POST 요청 처리 - URL 본문에서 처리
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  // 요청 본문에서 URL 추출
  const body = await parseRequestBody(request);
  const { url, options } = body;

  // URL 유효성 검사
  validateUrl(url);

  // 스크래핑 실행
  const result = await getScrapingResult(url, options?.skipCache === true);

  return NextResponse.json(result);
}); 