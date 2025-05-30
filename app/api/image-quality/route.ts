/**
 * 이미지 품질 평가 API 라우트
 * 이미지 URL을 받아 품질을 평가하고 결과를 반환합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  assessImageQuality, 
  assessMultipleImagesQuality, 
  ImageQualityOptions
} from '@/lib/services/imageQualityService';

/**
 * 이미지 품질을 평가하는 API 핸들러
 * 
 * @param req 요청 객체
 * @returns API 응답
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, imageUrls, options } = body;

    // 요청 검증
    if (!imageUrl && (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0)) {
      return NextResponse.json(
        { error: '이미지 URL이 필요합니다. "imageUrl" 또는 "imageUrls" 배열을 제공해주세요.' },
        { status: 400 }
      );
    }

    // 평가 옵션 설정
    const qualityOptions: ImageQualityOptions = {
      minWidth: options?.minWidth || 800,
      minHeight: options?.minHeight || 600,
      includeMetadata: options?.includeMetadata !== false,
      weightFactors: options?.weightFactors || undefined,
      preferredAspectRatio: options?.preferredAspectRatio || undefined
    };

    // 단일 이미지 평가
    if (imageUrl) {
      const result = await assessImageQuality(imageUrl, qualityOptions);
      return NextResponse.json(result);
    }

    // 다수 이미지 평가
    const results = await assessMultipleImagesQuality(imageUrls, qualityOptions);
    return NextResponse.json(results);
  } catch (error) {
    console.error('이미지 품질 평가 API 오류:', error);
    
    return NextResponse.json(
      { error: '이미지 품질 평가 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이미지 품질 평가 API 라우트 설정
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 