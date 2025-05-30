"use client";

import { ImageAsset } from './types';

// OpenAI API 엔드포인트 URL
const OPENAI_API_URL = 'https://api.openai.com/v1';

/**
 * OpenAI API 설정 타입
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 기본 OpenAI 설정값
 */
const DEFAULT_CONFIG: Omit<OpenAIConfig, 'apiKey'> = {
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1500,
};

/**
 * 환경 변수 또는 로컬 스토리지에서 API 키 가져오기
 */
export function getOpenAIApiKey(): string | null {
  // 환경 변수에서 API 키를 먼저 확인
  const envApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (envApiKey) {
    return envApiKey;
  }
  
  // 환경 변수에 없는 경우 로컬 스토리지에서 확인 (이전 호환성 유지)
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return localStorage.getItem('openai-api-key');
  } catch (error) {
    console.error('API 키 불러오기 오류:', error);
    return null;
  }
}

/**
 * 로컬 스토리지에 API 키 저장
 */
export function saveOpenAIApiKey(apiKey: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('openai-api-key', apiKey);
  } catch (error) {
    console.error('API 키 저장 오류:', error);
  }
}

/**
 * OpenAI 텍스트 생성 함수
 */
export async function generateText(
  prompt: string, 
  config: Partial<OpenAIConfig> = {}
): Promise<string> {
  const apiKey = config.apiKey || getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }
  
  const fullConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    apiKey,
  };
  
  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fullConfig.apiKey}`
      },
      body: JSON.stringify({
        model: fullConfig.model,
        messages: [
          { role: 'system', content: '당신은 상세페이지 제작을 돕는 웹디자이너이자 마케터터입니다. 사용자의 요청에 따라 상품 설명을 생성합니다.' },
          { role: 'user', content: prompt }
        ],
        temperature: fullConfig.temperature,
        max_tokens: fullConfig.maxTokens,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 오류: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('텍스트 생성 오류:', error);
    throw error;
  }
}

/**
 * 제품 설명 생성 함수
 */
export async function generateProductDescription(
  productName: string, 
  keywords: string[], 
  config: Partial<OpenAIConfig> = {}
): Promise<string> {
  const prompt = `
다음 제품에 대한 상세 설명을 작성해주세요:

제품명: ${productName}
키워드: ${keywords.join(', ')}

설명에는 다음 내용을 포함해주세요:
1. 제품의 주요 특징과 장점
2. 사용 방법이나 활용 팁
3. 제품의 차별점
4. 고객이 얻을 수 있는 가치나 혜택

마케팅적인 문구와 감성적인 표현을 적절히 섞어서 작성해주세요.
결과는 HTML 태그 없이 순수 텍스트로만 반환해주세요.
`;

  return await generateText(prompt, config);
}

/**
 * 이미지 분석 함수
 */
export async function analyzeImage(
  imageUrl: string,
  config: Partial<OpenAIConfig> = {}
): Promise<string> {
  const apiKey = config.apiKey || getOpenAIApiKey();
  
  if (!apiKey) {
    throw new Error('OpenAI API 키가 설정되지 않았습니다.');
  }
  
  const fullConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    apiKey,
  };
  
  try {
    const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${fullConfig.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',  // Vision 기능이 있는 모델 사용
        messages: [
          { 
            role: 'system', 
            content: '당신은 전문적인 이미지 분석가입니다. 제품 이미지를 보고 상세한 특징과 세부 정보를 체계적으로 분석해 주세요. 분석 결과는 다음 카테고리로 나누어 응답해 주세요: 소재, 디자인, 색상, 디테일, 기능성, 크기, 품질. 각 카테고리별로 관련 정보를 상세히 제공하고, 제품의 강점과 특징을 부각시켜 주세요. 분석 시 한국어로 된 텍스트가 있다면 이를 참고해서 분석해 주세요.' 
          },
          { 
            role: 'user',
            content: [
              { type: 'text', text: '이 제품 이미지를 분석하고 다음 카테고리에 맞춰 상세하게 설명해주세요: 소재, 디자인, 색상, 디테일, 기능성, 품질. 제품의 주요 특징과 장점을 강조해주세요.' },
              { 
                type: 'image_url', 
                image_url: {
                  url: imageUrl,
                }
              }
            ]
          }
        ],
        temperature: fullConfig.temperature,
        max_tokens: fullConfig.maxTokens,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API 오류: ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('이미지 분석 오류:', error);
    throw error;
  }
}

/**
 * 프로젝트 자료 기반 상세 페이지 콘텐츠 생성
 */
export async function generateDetailContent(
  projectName: string,
  productText: string,
  images: ImageAsset[],
  shopUrl: string | null,
  config: Partial<OpenAIConfig> = {}
): Promise<string> {
  // 이미지 개수만 전달
  const imageCount = images.length;
  const imageDescription = imageCount > 0 
    ? `총 ${imageCount}장의 이미지가 있습니다. 생성된 콘텐츠에 [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2] 등의 형태로 이미지 위치를 표시해주세요.` 
    : '이미지 없음';
  
  const prompt = `
다음 정보를 바탕으로 상품 상세 페이지에 들어갈 콘텐츠를 생성해주세요:

상품명: ${projectName}
상품 설명: ${productText}
이미지 정보: ${imageDescription}
참고 쇼핑몰 URL: ${shopUrl || '없음'}

다음 항목을 포함한 HTML 형태의 콘텐츠를 생성해주세요:
1. 눈길을 끄는 제목(h1 태그)
2. 상품의 주요 특징을 강조하는 소제목들(h2 태그)
3. 각 특징에 대한 설명(p 태그)
4. 필요시 리스트 형태의 정보(ul, li 태그)
5. 구매를 유도하는 문구(강조 태그 활용)

중요: 이미지는 직접 삽입하지 말고, 이미지가 들어가야 할 위치마다 [IMAGE_PLACEHOLDER_1], [IMAGE_PLACEHOLDER_2] 등의 형태로 순차적으로 표시해주세요. 최대 ${imageCount}개의 이미지 위치를 지정할 수 있습니다.

결과는 HTML 태그를 포함하여 반환해주세요.
`;

  const response = await generateText(prompt, {
    ...config,
    maxTokens: 2000, // 토큰 수 제한
  });
  
  // 응답에서 이미지 플레이스홀더를 실제 이미지 태그로 대체
  let result = response;
  images.forEach((img, index) => {
    const imageUrl = img.path || img.url || '';
    if (imageUrl) {
      const placeholder = `[IMAGE_PLACEHOLDER_${index + 1}]`;
      const imageTag = `
<div class="product-image-container">
  <img src="${imageUrl}" alt="${projectName} 이미지 ${index + 1}" class="product-image" style="max-width: 100%; border-radius: 8px; margin: 20px 0;" />
</div>`;
      
      result = result.replace(new RegExp(placeholder, 'g'), imageTag);
    }
  });
  
  return result;
}

/**
 * API 연결 테스트 함수
 */
export async function testApiConnection(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${OPENAI_API_URL}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('API 연결 테스트 오류:', error);
    return false;
  }
} 