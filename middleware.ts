import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 보안 헤더를 적용하는 미들웨어
 * @param request Next.js 요청 객체
 * @returns Next.js 응답 객체
 */
export function middleware(request: NextRequest) {
  // 응답 헤더 설정을 위한 NextResponse 생성
  const response = NextResponse.next();
  
  // Content Security Policy 설정
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https://*.supabase.co https://api.openai.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
  
  // 보안 헤더 설정
  const headers = response.headers;
  
  // Content-Security-Policy
  headers.set('Content-Security-Policy', cspHeader);
  
  // XSS 방지
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // MIME 스니핑 방지
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // 클릭재킹 방지
  headers.set('X-Frame-Options', 'DENY');
  
  // HSTS (HTTPS 강제)
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // 참조자 정책
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 권한 정책
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

/**
 * 미들웨어가 적용될 경로 설정
 */
export const config = {
  matcher: [
    /*
     * 미들웨어 적용 대상 경로:
     * - 모든 페이지 경로
     * - 제외 경로: 
     *   - API 경로 (/api/*)
     *   - 정적 파일 경로 (/_next/static/*, /favicon.ico 등)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 