/**
 * 쇼핑몰 스타일 분석을 위한 OpenAI API 라우트
 * 스크래핑된 쇼핑몰 데이터를 받아 OpenAI API로 분석하여 스타일 가이드를 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// 캐시 유효 기간 (24시간)
const CACHE_TTL = 60 * 60 * 24;

// 분석 옵션 인터페이스
interface AnalysisOptions {
  useCache?: boolean;
  detailLevel?: 'basic' | 'detailed' | 'comprehensive';
  focus?: 'general' | 'colors' | 'typography' | 'layout';
}

/**
 * 캐시 키 생성 함수
 * @param url 분석 대상 URL
 * @param options 분석 옵션
 * @returns 캐시 키
 */
function generateCacheKey(data: any, options: AnalysisOptions): string {
  // URL과 옵션으로 고유한 캐시 키 생성
  const dataHash = JSON.stringify({
    title: data.title,
    colors: data.colors,
    fonts: data.fonts,
    products: Array.isArray(data.products) ? data.products.length : 0
  });
  
  const optionsHash = JSON.stringify(options);
  return `style-analysis:${Buffer.from(dataHash).toString('base64')}:${Buffer.from(optionsHash).toString('base64')}`;
}

/**
 * OpenAI API 호출 함수
 * @param promptData 분석할 데이터
 * @param options 분석 옵션
 * @returns 분석 결과
 */
async function callOpenAI(promptData: any, options: AnalysisOptions = {}) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다.');
    }
    
    // 상세 수준에 따른 모델 선택
    const model = options.detailLevel === 'comprehensive' ? 'gpt-4o' : 'gpt-4-turbo';
    
    // 분석 초점에 따른 추가 지시 생성
    let focusPrompt = '';
    switch (options.focus) {
      case 'colors':
        focusPrompt = '색상 분석에 특별히 중점을 두고, 색상 조화, 대비, 심리적 효과 등을 자세히 분석해주세요. 색상 팔레트 추천도 더 많이 제공해주세요.';
        break;
      case 'typography':
        focusPrompt = '타이포그래피 분석에 특별히 중점을 두고, 폰트 스타일, 가독성, 계층구조, 브랜드 일관성 등을 자세히 분석해주세요. 추천 폰트 페어링을 더 많이 제공해주세요.';
        break;
      case 'layout':
        focusPrompt = '레이아웃 분석에 특별히 중점을 두고, 공간 활용, 그리드 시스템, 사용자 경험, 반응형 디자인 등을 자세히 분석해주세요. 레이아웃 개선 사항을 더 자세히 제공해주세요.';
        break;
      default:
        focusPrompt = '모든 디자인 요소들을 균형있게 분석해주세요.';
    }
    
    // 분석 상세 수준에 따른 지시 추가
    let detailPrompt = '';
    switch (options.detailLevel) {
      case 'comprehensive':
        detailPrompt = '매우 상세하고 전문적인 수준의 분석을 제공해주세요. 디자인 원칙과 이론을 적용하여 학술적인 깊이를 더해주세요.';
        break;
      case 'detailed':
        detailPrompt = '일반적인 수준보다 더 자세한 분석을 제공해주세요. 실용적인 조언과 함께 각 요소별 강점과 약점을 설명해주세요.';
        break;
      default:
        detailPrompt = '기본적인 수준의 분석을 제공해주세요.';
    }
    
    // 프롬프트 생성
    const prompt = `
    당신은 전문 웹 디자이너이자 브랜드 스타일리스트입니다. 쇼핑몰 웹사이트의 데이터를 분석하여 상세한 스타일 가이드를 생성해주세요.
    
    ## 분석 초점
    ${focusPrompt}
    
    ## 분석 상세도
    ${detailPrompt}
    
    ## 쇼핑몰 정보:
    - 제목: ${promptData.title}
    - 설명: ${promptData.description}
    - 사용된 색상: ${promptData.colors.join(', ')}
    - 사용된 폰트: ${promptData.fonts.join(', ')}
    - 이미지 수: ${promptData.imageCount}
    
    ## 제품 정보:
    ${JSON.stringify(promptData.products, null, 2)}
    
    다음 형식으로 스타일 가이드를 JSON 형식으로 제공해주세요:
    
    {
      "colorPalette": {
        "primary": ["#색상코드1", "#색상코드2"],
        "secondary": ["#색상코드1", "#색상코드2"],
        "accent": ["#색상코드1"],
        "background": ["#색상코드1"]
      },
      "typography": {
        "headingFont": "폰트명",
        "bodyFont": "폰트명",
        "fontPairings": ["폰트 조합1", "폰트 조합2"],
        "styleDescription": "이 쇼핑몰의 타이포그래피 스타일에 대한 설명"
      },
      "designElements": {
        "patterns": ["패턴1", "패턴2"],
        "shapes": ["모양1", "모양2"],
        "iconStyle": "아이콘 스타일 설명"
      },
      "brandMood": {
        "description": "이 쇼핑몰의 전반적인 분위기 설명",
        "keywords": ["키워드1", "키워드2", "키워드3"],
        "targetAudience": "타겟 고객층 설명"
      },
      "recommendations": {
        "colorUsage": "색상 사용 추천",
        "typographyUsage": "타이포그래피 사용 추천",
        "imageStyle": "이미지 스타일 추천",
        "layoutSuggestions": "레이아웃 제안"
      }
    }
    
    오직 JSON 형식으로만 답변해 주세요. 다른 텍스트나 설명은 포함하지 마세요.
    `;
    
    // OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: '당신은 전문 웹 디자이너이자 브랜드 스타일리스트입니다. 쇼핑몰 웹사이트의 스타일을 분석하고 JSON 형식으로 결과를 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: options.detailLevel === 'comprehensive' ? 4000 : 2000,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API 호출 실패: ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    try {
      // 응답에서 JSON 추출
      const content = data.choices[0].message.content;
      // JSON 문자열을 파싱
      return JSON.parse(content);
    } catch (parseError) {
      console.error('OpenAI 응답 파싱 실패:', parseError);
      throw new Error('OpenAI API 응답을 파싱할 수 없습니다.');
    }
  } catch (error) {
    console.error('OpenAI API 호출 오류:', error);
    throw error;
  }
}

/**
 * POST 요청 처리 - 쇼핑몰 스타일 분석 실행
 * @param request NextRequest 객체
 * @returns API 응답
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.title && !body.description) {
      return NextResponse.json(
        { error: '분석을 위한 충분한 데이터가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }
    
    // 분석 옵션 설정
    const options: AnalysisOptions = {
      useCache: body.useCache !== false, // 기본값: true
      detailLevel: body.detailLevel || 'detailed',
      focus: body.focus || 'general'
    };
    
    let analysis;
    
    // 캐시 사용 설정 시 캐시 확인
    if (options.useCache && kv) {
      const cacheKey = generateCacheKey(body, options);
      const cachedResult = await kv.get(cacheKey);
      
      if (cachedResult) {
        console.log('캐시된 스타일 분석 결과를 사용합니다.');
        analysis = cachedResult;
      } else {
        // 캐시에 없으면 새로 분석
        analysis = await callOpenAI(body, options);
        
        // 결과 캐싱
        if (analysis) {
          await kv.set(cacheKey, analysis, { ex: CACHE_TTL });
          console.log('스타일 분석 결과를 캐시에 저장했습니다.');
        }
      }
    } else {
      // 캐시 사용하지 않음
      analysis = await callOpenAI(body, options);
    }
    
    // 결과 반환
    return NextResponse.json({ 
      analysis,
      meta: {
        model: options.detailLevel === 'comprehensive' ? 'gpt-4o' : 'gpt-4-turbo',
        detailLevel: options.detailLevel,
        focus: options.focus,
        cached: options.useCache && analysis !== null
      }
    });
  } catch (error) {
    console.error('스타일 분석 API 오류:', error);
    
    return NextResponse.json(
      { error: `스타일 분석 중 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 