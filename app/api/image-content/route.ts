/**
 * 이미지 내용 분석 API 라우트
 * OpenAI API를 활용하여 이미지 내용을 분석하고 결과를 반환합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeImageContent, 
  analyzeMultipleImagesContent, 
  ImageContentAnalysisOptions 
} from '@/lib/services/imageContentAnalysisService';

/**
 * 이미지 내용을 분석하는 API 핸들러
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

    // 분석 옵션 설정
    const analysisOptions: ImageContentAnalysisOptions = {
      productType: options?.productType || undefined,
      targetAudience: options?.targetAudience || undefined,
      brandStyle: options?.brandStyle || undefined,
      useCase: options?.useCase || undefined,
      detailLevel: options?.detailLevel || 'standard',
      language: options?.language || 'ko'
    };

    // 단일 이미지 분석
    if (imageUrl) {
      const result = await analyzeImageContent(imageUrl, analysisOptions);
      return NextResponse.json(result);
    }

    // 다수 이미지 분석
    const results = await analyzeMultipleImagesContent(imageUrls, analysisOptions);
    return NextResponse.json(results);
  } catch (error) {
    console.error('이미지 내용 분석 API 오류:', error);
    
    return NextResponse.json(
      { error: '이미지 내용 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 이미지 내용 분석 API 라우트 설정
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 