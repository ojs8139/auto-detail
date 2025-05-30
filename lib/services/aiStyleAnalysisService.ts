/**
 * OpenAI API를 활용한 쇼핑몰 스타일 분석 서비스
 * 스크래핑된 데이터를 OpenAI API로 분석하여 고급 스타일 가이드를 생성합니다.
 */

import { StyleAnalysisResult } from './styleAnalysisService';

// 스타일 분석 옵션 인터페이스
export interface StyleAnalysisOptions {
  useCache?: boolean; // 캐시 사용 여부 (기본값: true)
  detailLevel?: 'basic' | 'detailed' | 'comprehensive'; // 분석 상세도 (기본값: detailed)
  focus?: 'general' | 'colors' | 'typography' | 'layout'; // 분석 초점 (기본값: general)
}

// 상세 스타일 분석 결과 인터페이스
export interface DetailedStyleAnalysis {
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontPairings: string[];
    styleDescription: string;
  };
  designElements: {
    patterns: string[];
    shapes: string[];
    iconStyle: string;
  };
  brandMood: {
    description: string;
    keywords: string[];
    targetAudience: string;
  };
  recommendations: {
    colorUsage: string;
    typographyUsage: string;
    imageStyle: string;
    layoutSuggestions: string;
  };
}

/**
 * 스크래핑된 데이터를 기반으로 OpenAI API를 사용하여 스타일을 분석합니다.
 * @param scrapedData 스크래핑된 쇼핑몰 데이터
 * @param options 스타일 분석 옵션
 * @returns 상세 스타일 분석 결과
 */
export const analyzeStyleWithAI = async (
  scrapedData: any,
  options: StyleAnalysisOptions = {}
): Promise<DetailedStyleAnalysis> => {
  try {
    // OpenAI API 엔드포인트 경로
    const apiEndpoint = '/api/ai/analyze-style';
    
    // 분석에 필요한 데이터 준비
    const analysisData = {
      title: scrapedData.metadata?.title || '',
      description: scrapedData.metadata?.description || '',
      colors: scrapedData.colors || [],
      fonts: scrapedData.fonts || [],
      imageCount: scrapedData.images?.length || 0,
      products: scrapedData.products || [],
      // 옵션 추가
      useCache: options.useCache !== false,
      detailLevel: options.detailLevel || 'detailed',
      focus: options.focus || 'general'
    };
    
    // OpenAI API 호출 (서버 사이드에서 처리)
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analysisData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 요청 실패: ${errorData.error || response.statusText}`);
    }
    
    const result = await response.json();
    return result.analysis;
  } catch (error) {
    console.error('AI 스타일 분석 실패:', error);
    throw new Error(`AI 스타일 분석 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 스크래핑된 데이터와 AI 분석 결과를 결합하여 완전한 스타일 가이드를 생성합니다.
 * @param basicAnalysis 기본 스타일 분석 결과
 * @param aiAnalysis AI 기반 상세 스타일 분석
 * @returns 업데이트된 스타일 분석 결과
 */
export const enrichStyleAnalysis = (
  basicAnalysis: StyleAnalysisResult,
  aiAnalysis: DetailedStyleAnalysis
): StyleAnalysisResult => {
  // 기존 스타일 분석에 AI 분석 결과 병합
  return {
    ...basicAnalysis,
    styleGuide: {
      ...basicAnalysis.styleGuide,
      // 색상 정보 업데이트
      colors: basicAnalysis.styleGuide.colors || [],
      dominantColors: [
        ...(aiAnalysis.colorPalette.primary || []),
        ...(aiAnalysis.colorPalette.accent || []),
      ],
      
      // 타이포그래피 정보 추가
      typography: {
        heading: aiAnalysis.typography.headingFont,
        body: aiAnalysis.typography.bodyFont,
        pairings: aiAnalysis.typography.fontPairings,
        description: aiAnalysis.typography.styleDescription,
      },
      
      // 디자인 요소 추가
      designElements: aiAnalysis.designElements,
      
      // 브랜드 분위기 추가
      mood: aiAnalysis.brandMood.description,
      keywords: aiAnalysis.brandMood.keywords,
      targetAudience: aiAnalysis.brandMood.targetAudience,
      
      // 추천 사항 추가
      recommendations: aiAnalysis.recommendations,
    },
    updatedAt: new Date().toISOString(),
  };
}; 