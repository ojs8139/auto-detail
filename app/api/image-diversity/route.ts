/**
 * 이미지 다양성 분석 API 라우트
 * 이미지 다양성을 분석하고 중복을 제거하여 최적의 이미지 세트를 추천합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  analyzeImageDiversity, 
  recommendDiverseImageSet, 
  ImageAnalysisData,
  DiversityOptions
} from '@/lib/services/imageDiversityService';

/**
 * 이미지 다양성을 분석하는 API 핸들러
 * 
 * @param req 요청 객체
 * @returns API 응답
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, options } = body;

    // 요청 검증
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '이미지 분석 데이터가 필요합니다. "images" 배열을 제공해주세요.' },
        { status: 400 }
      );
    }

    // 이미지 배열 유효성 검사
    const validImages = images.filter(img => img && typeof img.imageUrl === 'string');
    if (validImages.length === 0) {
      return NextResponse.json(
        { error: '유효한 이미지 분석 데이터가 없습니다. 각 이미지는 imageUrl 속성이 필요합니다.' },
        { status: 400 }
      );
    }

    // 다양성 분석 실행
    const analysisOptions: DiversityOptions = options || {};
    const diversityAnalysis = await analyzeImageDiversity(validImages as ImageAnalysisData[], analysisOptions);
    
    // 추천 이미지 세트 생성
    const recommendations = await recommendDiverseImageSet(validImages as ImageAnalysisData[], analysisOptions);

    return NextResponse.json({
      analysis: diversityAnalysis,
      recommendations
    });

  } catch (error) {
    console.error('이미지 다양성 분석 중 오류 발생:', error);
    
    return NextResponse.json(
      { error: '이미지 다양성 분석 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 