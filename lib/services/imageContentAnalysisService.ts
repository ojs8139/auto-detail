/**
 * 이미지 내용 분석 서비스
 * OpenAI API를 활용하여 이미지 내용을 분석하고, 제품 중심 이미지를 식별하며 배경 적합성을 평가합니다.
 */

import OpenAI from 'openai';
import { createClient } from '@vercel/kv';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 캐싱을 위한 KV 스토어 클라이언트 생성 (설정된 경우)
let kvClient: ReturnType<typeof createClient> | null = null;

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kvClient = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch (error) {
  console.error('KV 클라이언트 생성 실패:', error);
  kvClient = null;
}

/**
 * 이미지 분석 결과 인터페이스
 */
export interface ImageContentAnalysis {
  imageUrl: string;
  productFocus: {
    score: number; // 0-1 점수 (높을수록 제품 중심)
    details: string;
  };
  backgroundSuitability: {
    score: number; // 0-1 점수 (높을수록 적합)
    details: string;
  };
  contentType: {
    isProduct: boolean;
    isLifestyle: boolean;
    isInfographic: boolean;
    isPerson: boolean;
    details: string;
  };
  objects: {
    main: string;
    others: string[];
  };
  colorScheme: {
    primary: string;
    secondary: string[];
    dominant: string;
  };
  mood: {
    description: string;
    tags: string[];
  };
  commercialValue: {
    score: number; // 0-1 점수 (높을수록 상업적 가치가 높음)
    details: string;
  };
  recommendedUse: {
    section: 'main' | 'detail' | 'lifestyle' | 'specification' | 'other';
    reason: string;
  };
  analysisTimestamp: number;
}

/**
 * 이미지 분석 옵션 인터페이스
 */
export interface ImageContentAnalysisOptions {
  productType?: string;  // 제품 유형 (예: '의류', '가구', '전자제품')
  targetAudience?: string; // 타겟 고객층 (예: '20대 여성', '중년 남성', '어린이')
  brandStyle?: string; // 브랜드 스타일 (예: '모던', '캐주얼', '럭셔리')
  useCase?: string; // 사용 목적 (예: '상세페이지', '배너', '소셜미디어')
  detailLevel?: 'basic' | 'standard' | 'detailed'; // 분석 상세도
  language?: string; // 결과 언어 (기본값: 'ko')
}

/**
 * OpenAI API를 통해 이미지 내용 분석
 * 
 * @param imageUrl 이미지 URL
 * @param options 분석 옵션
 * @returns 분석 결과
 */
export async function analyzeImageContent(
  imageUrl: string,
  options: ImageContentAnalysisOptions = {}
): Promise<ImageContentAnalysis> {
  try {
    // 캐시된 결과 확인
    if (kvClient) {
      const cacheKey = `image_content:${imageUrl}:${JSON.stringify(options)}`;
      const cachedResult = await kvClient.get(cacheKey);
      
      if (cachedResult) {
        return cachedResult as ImageContentAnalysis;
      }
    }

    // 기본 옵션 설정
    const {
      productType = '일반 제품',
      targetAudience = '일반 고객',
      brandStyle = '표준',
      useCase = '상세페이지',
      detailLevel = 'standard',
      language = 'ko'
    } = options;

    // OpenAI API 요청을 위한 프롬프트 구성
    const systemPrompt = `당신은 이커머스 이미지 분석 전문가입니다. 제공된 이미지를 분석하여 다음 정보를 JSON 형식으로 제공해주세요:

1. productFocus: 이미지에서 제품이 얼마나 중심적으로 표현되었는지 평가 (0-1 점수와 설명)
2. backgroundSuitability: 배경이 제품을 돋보이게 하는지 적합성 평가 (0-1 점수와 설명)
3. contentType: 이미지 유형 분류 (제품 중심, 라이프스타일, 인포그래픽, 인물 중심 여부와 설명)
4. objects: 이미지에서 식별된 주요 객체와 기타 객체 목록
5. colorScheme: 이미지의 주요 색상 스킴 (주 색상, 보조 색상 배열, 지배적 색상)
6. mood: 이미지가 전달하는 분위기 (설명과 태그 배열)
7. commercialValue: 상업적 가치 평가 (0-1 점수와 설명)
8. recommendedUse: 이미지 권장 사용처 (main, detail, lifestyle, specification, other 중 하나와 이유)

다음 정보를 고려하여 분석하세요:
- 제품 유형: ${productType}
- 타겟 고객층: ${targetAudience}
- 브랜드 스타일: ${brandStyle}
- 사용 목적: ${useCase}

상세한 분석을 ${language}로 제공해주세요.`;

    // Vision API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: "이 이미지를 분석해주세요." },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: detailLevel === 'detailed' ? 'high' : 'auto'
              }
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    // API 응답 파싱
    const responseContent = response.choices[0]?.message?.content || '{}';
    let analysisResult: any;
    
    try {
      analysisResult = JSON.parse(responseContent);
    } catch (error) {
      console.error('OpenAI 응답 파싱 실패:', error);
      throw new Error('이미지 분석 결과를 파싱할 수 없습니다.');
    }

    // 결과 객체 구성
    const result: ImageContentAnalysis = {
      imageUrl,
      productFocus: analysisResult.productFocus || { score: 0.5, details: '분석 실패' },
      backgroundSuitability: analysisResult.backgroundSuitability || { score: 0.5, details: '분석 실패' },
      contentType: analysisResult.contentType || { 
        isProduct: false, 
        isLifestyle: false, 
        isInfographic: false, 
        isPerson: false, 
        details: '분석 실패' 
      },
      objects: analysisResult.objects || { main: '알 수 없음', others: [] },
      colorScheme: analysisResult.colorScheme || { 
        primary: '알 수 없음', 
        secondary: [], 
        dominant: '알 수 없음' 
      },
      mood: analysisResult.mood || { description: '알 수 없음', tags: [] },
      commercialValue: analysisResult.commercialValue || { score: 0.5, details: '분석 실패' },
      recommendedUse: analysisResult.recommendedUse || { 
        section: 'other', 
        reason: '분석 실패' 
      },
      analysisTimestamp: Date.now()
    };

    // 결과 캐싱 (KV 스토어가 설정된 경우)
    if (kvClient) {
      const cacheKey = `image_content:${imageUrl}:${JSON.stringify(options)}`;
      // 24시간 캐시 (86400초)
      await kvClient.set(cacheKey, result, { ex: 86400 });
    }

    return result;
  } catch (error) {
    console.error('이미지 내용 분석 실패:', error);
    
    // 오류 발생 시 기본 결과 반환
    return {
      imageUrl,
      productFocus: { score: 0, details: '분석 중 오류 발생' },
      backgroundSuitability: { score: 0, details: '분석 중 오류 발생' },
      contentType: { 
        isProduct: false, 
        isLifestyle: false, 
        isInfographic: false, 
        isPerson: false, 
        details: '분석 중 오류 발생' 
      },
      objects: { main: '알 수 없음', others: [] },
      colorScheme: { primary: '알 수 없음', secondary: [], dominant: '알 수 없음' },
      mood: { description: '분석 중 오류 발생', tags: [] },
      commercialValue: { score: 0, details: '분석 중 오류 발생' },
      recommendedUse: { section: 'other', reason: '분석 중 오류 발생' },
      analysisTimestamp: Date.now()
    };
  }
}

/**
 * 여러 이미지 내용 분석
 * 
 * @param imageUrls 이미지 URL 배열
 * @param options 분석 옵션
 * @returns 분석 결과 배열
 */
export async function analyzeMultipleImagesContent(
  imageUrls: string[],
  options: ImageContentAnalysisOptions = {}
): Promise<ImageContentAnalysis[]> {
  try {
    // 이미지 URL이 없는 경우 빈 배열 반환
    if (!imageUrls.length) {
      return [];
    }

    // 최대 5개까지만 처리 (API 비용 고려)
    const limitedUrls = imageUrls.slice(0, 5);
    
    // 병렬로 이미지 분석 실행
    const analysisPromises = limitedUrls.map(url => analyzeImageContent(url, options));
    return await Promise.all(analysisPromises);
  } catch (error) {
    console.error('다수 이미지 내용 분석 실패:', error);
    return [];
  }
}

/**
 * 제품 이미지 필터링
 * 
 * @param analyses 이미지 분석 결과 배열
 * @param minProductFocusScore 최소 제품 중심 점수
 * @returns 필터링된 이미지 URL 배열
 */
export function filterProductImages(
  analyses: ImageContentAnalysis[],
  minProductFocusScore = 0.7
): string[] {
  return analyses
    .filter(analysis => 
      analysis.contentType.isProduct && 
      analysis.productFocus.score >= minProductFocusScore
    )
    .map(analysis => analysis.imageUrl);
}

/**
 * 라이프스타일 이미지 필터링
 * 
 * @param analyses 이미지 분석 결과 배열
 * @returns 필터링된 이미지 URL 배열
 */
export function filterLifestyleImages(analyses: ImageContentAnalysis[]): string[] {
  return analyses
    .filter(analysis => analysis.contentType.isLifestyle)
    .map(analysis => analysis.imageUrl);
}

/**
 * 이미지를 권장 사용처별로 분류
 * 
 * @param analyses 이미지 분석 결과 배열
 * @returns 섹션별 이미지 URL 맵
 */
export function categorizeImagesByRecommendedUse(
  analyses: ImageContentAnalysis[]
): Record<'main' | 'detail' | 'lifestyle' | 'specification' | 'other', string[]> {
  const result: Record<'main' | 'detail' | 'lifestyle' | 'specification' | 'other', string[]> = {
    main: [],
    detail: [],
    lifestyle: [],
    specification: [],
    other: []
  };

  analyses.forEach(analysis => {
    const section = analysis.recommendedUse.section;
    if (section in result) {
      result[section].push(analysis.imageUrl);
    } else {
      result.other.push(analysis.imageUrl);
    }
  });

  return result;
}

/**
 * 분석 결과에서 최적의 메인 이미지 선택
 * 
 * @param analyses 이미지 분석 결과 배열
 * @returns 최적의 메인 이미지 URL 또는 null
 */
export function selectBestMainImage(analyses: ImageContentAnalysis[]): string | null {
  if (!analyses.length) return null;

  // 메인으로 권장된 이미지 중에서 상업적 가치가 가장 높은 이미지 선택
  const mainImages = analyses.filter(analysis => analysis.recommendedUse.section === 'main');
  
  if (mainImages.length > 0) {
    const bestMain = mainImages.sort((a, b) => b.commercialValue.score - a.commercialValue.score)[0];
    return bestMain.imageUrl;
  }
  
  // 메인으로 권장된 이미지가 없는 경우, 제품 중심 이미지 중에서 선택
  const productImages = analyses.filter(analysis => analysis.contentType.isProduct);
  
  if (productImages.length > 0) {
    // 제품 중심도와 상업적 가치를 결합한 점수로 정렬
    const bestProduct = productImages.sort((a, b) => {
      const scoreA = (a.productFocus.score + a.commercialValue.score) / 2;
      const scoreB = (b.productFocus.score + b.commercialValue.score) / 2;
      return scoreB - scoreA;
    })[0];
    
    return bestProduct.imageUrl;
  }
  
  // 최후의 경우, 모든 이미지 중에서 상업적 가치가 가장 높은 이미지 선택
  const bestOverall = analyses.sort((a, b) => b.commercialValue.score - a.commercialValue.score)[0];
  return bestOverall.imageUrl;
} 