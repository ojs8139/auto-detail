/**
 * 이미지 다양성 및 중복 제거 서비스
 * 이미지의 다양성을 확보하고 중복을 제거하는 기능을 제공합니다.
 */

import { ImageContentAnalysis } from './imageContentAnalysisService';
import { ImageQualityAssessment } from './imageQualityService';
import { createClient } from '@vercel/kv';

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
 * 이미지 분석 데이터 인터페이스
 * 품질 및 내용 분석 결과를 통합합니다.
 */
export interface ImageAnalysisData {
  imageUrl: string;
  quality?: ImageQualityAssessment;
  content?: ImageContentAnalysis;
  similarityGroups?: string[];
  diversityScore?: number;
  overallScore?: number;
}

/**
 * 다양성 분석 옵션 인터페이스
 */
export interface DiversityOptions {
  prioritizeQuality?: boolean;
  prioritizeContent?: boolean;
  minDiversityScore?: number;
  maxGroupSize?: number;
  minImagesPerCategory?: number;
  targetCategories?: {
    main?: number;
    detail?: number;
    lifestyle?: number;
    specification?: number;
  };
}

/**
 * 이미지 분석 결과를 캐싱하는 함수
 * 
 * @param cacheKey 캐시 키
 * @param data 캐싱할 데이터
 * @param ttl 캐시 유효 시간(초)
 */
async function cacheImageAnalysis(cacheKey: string, data: any, ttl = 86400): Promise<void> {
  if (!kvClient) return;

  try {
    await kvClient.set(`image-diversity:${cacheKey}`, JSON.stringify(data), {
      ex: ttl, // 기본 24시간 캐싱
    });
  } catch (error) {
    console.error('이미지 분석 결과 캐싱 실패:', error);
  }
}

/**
 * 캐시된 이미지 분석 결과를 가져오는 함수
 * 
 * @param cacheKey 캐시 키
 * @returns 캐시된 데이터 또는 null
 */
async function getCachedImageAnalysis(cacheKey: string): Promise<any | null> {
  if (!kvClient) return null;

  try {
    const cached = await kvClient.get(`image-diversity:${cacheKey}`);
    return cached ? JSON.parse(cached as string) : null;
  } catch (error) {
    console.error('캐시된 이미지 분석 결과 조회 실패:', error);
    return null;
  }
}

/**
 * 이미지 URL 목록에서 해시 생성
 * 
 * @param imageUrls 이미지 URL 목록
 * @returns 해시 문자열
 */
function generateImageSetHash(imageUrls: string[]): string {
  // 정렬하여 순서에 관계없이 동일한 세트는 동일한 해시 생성
  const sortedUrls = [...imageUrls].sort();
  return Buffer.from(sortedUrls.join('|')).toString('base64');
}

/**
 * 이미지 유사성 분석
 * 색상 구성, 내용 태그 등을 기반으로 유사성을 평가합니다.
 * 
 * @param images 이미지 분석 데이터 배열
 * @returns 유사성 점수 행렬 (0~1, 높을수록 유사)
 */
function calculateSimilarityMatrix(images: ImageAnalysisData[]): number[][] {
  const n = images.length;
  const similarityMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    // 자기 자신과의 유사도는 1
    similarityMatrix[i][i] = 1;
    
    for (let j = i + 1; j < n; j++) {
      const imageA = images[i];
      const imageB = images[j];
      
      let similarityScore = 0;
      let factorsCount = 0;
      
      // 내용 분석 결과가 있는 경우 유사성 계산
      if (imageA.content && imageB.content) {
        // 1. 콘텐츠 유형 유사성 (같은 유형이면 높은 점수)
        const contentTypeA = getContentType(imageA.content);
        const contentTypeB = getContentType(imageB.content);
        similarityScore += contentTypeA === contentTypeB ? 0.3 : 0;
        factorsCount++;
        
        // 2. 권장 사용처 섹션 유사성
        const sectionA = imageA.content.recommendedUse.section;
        const sectionB = imageB.content.recommendedUse.section;
        similarityScore += sectionA === sectionB ? 0.25 : 0;
        factorsCount++;
        
        // 3. 태그 유사성 (공통 태그 비율)
        const tagsA = new Set(imageA.content.mood.tags);
        const tagsB = new Set(imageB.content.mood.tags);
        const commonTags = [...tagsA].filter(tag => tagsB.has(tag)).length;
        const tagSimilarity = commonTags / Math.max(1, Math.min(tagsA.size, tagsB.size));
        similarityScore += tagSimilarity * 0.15;
        factorsCount++;
        
        // 4. 색상 스킴 유사성
        const dominantColorA = imageA.content.colorScheme.dominant;
        const dominantColorB = imageB.content.colorScheme.dominant;
        const colorSimilarity = calculateColorSimilarity(dominantColorA, dominantColorB);
        similarityScore += colorSimilarity * 0.2;
        factorsCount++;
        
        // 5. 객체 유사성 (메인 객체가 같으면 높은 점수)
        const mainObjectA = imageA.content.objects.main;
        const mainObjectB = imageB.content.objects.main;
        similarityScore += mainObjectA === mainObjectB ? 0.3 : 0;
        factorsCount++;
      }
      
      // 품질 분석 결과가 있는 경우 해상도 비교
      if (imageA.quality && imageB.quality) {
        const resolutionA = imageA.quality.resolution.width * imageA.quality.resolution.height;
        const resolutionB = imageB.quality.resolution.width * imageB.quality.resolution.height;
        const resolutionRatio = Math.min(resolutionA, resolutionB) / Math.max(resolutionA, resolutionB);
        
        // 해상도가 비슷하면 유사도 증가
        if (resolutionRatio > 0.8) {
          similarityScore += 0.1;
        }
        factorsCount++;
      }
      
      // 정규화 (요소 개수로 나누어 0~1 범위로 조정)
      const normalizedScore = factorsCount > 0 ? similarityScore / factorsCount : 0;
      
      // 대칭적으로 설정 (A와 B의 유사도 = B와 A의 유사도)
      similarityMatrix[i][j] = normalizedScore;
      similarityMatrix[j][i] = normalizedScore;
    }
  }
  
  return similarityMatrix;
}

/**
 * 색상 유사성 계산 (HEX 코드 기반)
 * 
 * @param colorA 첫 번째 색상 (HEX)
 * @param colorB 두 번째 색상 (HEX)
 * @returns 유사성 점수 (0~1)
 */
function calculateColorSimilarity(colorA: string, colorB: string): number {
  try {
    // HEX 색상 코드를 RGB로 변환
    const rgbA = hexToRgb(colorA);
    const rgbB = hexToRgb(colorB);
    
    if (!rgbA || !rgbB) return 0;
    
    // 유클리드 거리 계산 (RGB 공간에서)
    const distance = Math.sqrt(
      Math.pow(rgbA.r - rgbB.r, 2) +
      Math.pow(rgbA.g - rgbB.g, 2) +
      Math.pow(rgbA.b - rgbB.b, 2)
    );
    
    // 최대 거리는 sqrt(255^2 + 255^2 + 255^2) = 441.67...
    const maxDistance = Math.sqrt(3 * Math.pow(255, 2));
    
    // 거리를 유사성 점수로 변환 (거리가 클수록 유사성은 낮음)
    return 1 - (distance / maxDistance);
  } catch (e) {
    console.error('색상 유사성 계산 오류:', e);
    return 0;
  }
}

/**
 * HEX 색상 코드를 RGB로 변환
 * 
 * @param hex HEX 색상 코드
 * @returns RGB 값 객체 또는 null
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // HEX 코드 정규화 (#이 없으면 추가)
  const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
  
  // 유효한 HEX 코드인지 확인 (#RRGGBB 형식)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalizedHex);
  
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * 이미지 콘텐츠 유형 추출
 * 
 * @param content 이미지 내용 분석 결과
 * @returns 콘텐츠 유형 문자열
 */
function getContentType(content: ImageContentAnalysis): string {
  if (content.contentType.isProduct) return 'product';
  if (content.contentType.isLifestyle) return 'lifestyle';
  if (content.contentType.isInfographic) return 'infographic';
  if (content.contentType.isPerson) return 'person';
  return 'other';
}

/**
 * 유사성 행렬 기반 이미지 그룹화
 * 
 * @param images 이미지 분석 데이터 배열
 * @param similarityMatrix 유사성 행렬
 * @param similarityThreshold 유사성 임계값 (기본값: 0.7)
 * @returns 그룹화된 이미지 인덱스 배열
 */
function groupSimilarImages(
  images: ImageAnalysisData[],
  similarityMatrix: number[][],
  similarityThreshold = 0.7
): string[][] {
  const n = images.length;
  const visited = new Array(n).fill(false);
  const groups: string[][] = [];
  
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    
    const group: string[] = [images[i].imageUrl];
    visited[i] = true;
    
    for (let j = 0; j < n; j++) {
      if (i !== j && !visited[j] && similarityMatrix[i][j] >= similarityThreshold) {
        group.push(images[j].imageUrl);
        visited[j] = true;
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

/**
 * 다양성 점수 계산
 * 
 * @param images 이미지 분석 데이터 배열
 * @param similarityMatrix 유사성 행렬
 * @returns 각 이미지의 다양성 점수 (높을수록 독특함)
 */
function calculateDiversityScores(
  images: ImageAnalysisData[],
  similarityMatrix: number[][]
): number[] {
  const n = images.length;
  const diversityScores = new Array(n).fill(0);
  
  for (let i = 0; i < n; i++) {
    // 다른 모든 이미지와의 평균 유사도 계산
    let totalSimilarity = 0;
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        totalSimilarity += similarityMatrix[i][j];
      }
    }
    
    const avgSimilarity = n > 1 ? totalSimilarity / (n - 1) : 0;
    
    // 다양성 점수 = 1 - 평균 유사도 (유사도가 낮을수록 다양성 높음)
    diversityScores[i] = 1 - avgSimilarity;
  }
  
  return diversityScores;
}

/**
 * 종합 점수 계산
 * 
 * @param image 이미지 분석 데이터
 * @param diversityScore 다양성 점수
 * @param options 다양성 분석 옵션
 * @returns 종합 점수 (0~1)
 */
function calculateOverallScore(
  image: ImageAnalysisData,
  diversityScore: number,
  options: DiversityOptions
): number {
  let score = 0;
  let weightSum = 0;
  
  // 다양성 점수 (기본 가중치: 30%)
  score += diversityScore * 0.3;
  weightSum += 0.3;
  
  // 품질 점수 (있는 경우, 기본 가중치: 35%)
  if (image.quality) {
    const qualityWeight = options.prioritizeQuality ? 0.5 : 0.35;
    score += image.quality.overall.score * qualityWeight;
    weightSum += qualityWeight;
  }
  
  // 내용 관련성 점수 (있는 경우, 기본 가중치: 35%)
  if (image.content) {
    const contentWeight = options.prioritizeContent ? 0.5 : 0.35;
    const contentScore = (
      image.content.productFocus.score * 0.4 +
      image.content.commercialValue.score * 0.6
    );
    score += contentScore * contentWeight;
    weightSum += contentWeight;
  }
  
  // 정규화 (가중치 합으로 나누어 0~1 범위로 조정)
  return weightSum > 0 ? score / weightSum : 0;
}

/**
 * 중복 이미지 제거 및 다양성 분석
 * 
 * @param images 이미지 분석 데이터 배열
 * @param options 다양성 분석 옵션
 * @returns 다양성 분석 및 그룹화 결과
 */
export async function analyzeImageDiversity(
  images: ImageAnalysisData[],
  options: DiversityOptions = {}
): Promise<{
  images: ImageAnalysisData[];
  similarityGroups: string[][];
  recommendations: {
    diverse: ImageAnalysisData[];
    byCategory: Record<string, ImageAnalysisData[]>;
  };
}> {
  // 캐시 키 생성
  const imageUrls = images.map(img => img.imageUrl);
  const cacheKey = generateImageSetHash(imageUrls);
  
  // 캐시된 결과 확인
  const cached = await getCachedImageAnalysis(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 유사성 행렬 계산
  const similarityMatrix = calculateSimilarityMatrix(images);
  
  // 유사 이미지 그룹화
  const similarityThreshold = 0.75; // 75% 이상 유사하면 같은 그룹으로 간주
  const similarityGroups = groupSimilarImages(images, similarityMatrix, similarityThreshold);
  
  // 다양성 점수 계산
  const diversityScores = calculateDiversityScores(images, similarityMatrix);
  
  // 각 이미지에 다양성 점수 및 그룹 정보 추가
  const enrichedImages = images.map((image, index) => {
    // 이미지가 속한 그룹 찾기
    const belongingGroups = similarityGroups
      .filter(group => group.includes(image.imageUrl))
      .map(group => group.join(','));
    
    return {
      ...image,
      diversityScore: diversityScores[index],
      similarityGroups: belongingGroups,
      overallScore: calculateOverallScore(image, diversityScores[index], options)
    };
  });
  
  // 종합 점수 기준 내림차순 정렬
  enrichedImages.sort((a, b) => {
    return (b.overallScore || 0) - (a.overallScore || 0);
  });
  
  // 카테고리별 추천 이미지
  const categorizedImages: Record<string, ImageAnalysisData[]> = {
    main: [],
    detail: [],
    lifestyle: [],
    specification: []
  };
  
  // 각 이미지를 적절한 카테고리에 할당
  for (const image of enrichedImages) {
    if (!image.content) continue;
    
    const section = image.content.recommendedUse.section;
    if (section in categorizedImages) {
      categorizedImages[section].push(image);
    }
  }
  
  // 각 카테고리 내에서 다양성 및 종합 점수 기준 정렬
  Object.keys(categorizedImages).forEach(category => {
    categorizedImages[category].sort((a, b) => {
      return (b.overallScore || 0) - (a.overallScore || 0);
    });
    
    // 최대 그룹 크기 제한 적용
    const maxGroupSize = options.maxGroupSize || 3;
    categorizedImages[category] = categorizedImages[category].slice(0, maxGroupSize);
  });
  
  // 추천 다양한 이미지 선택 (종합 점수 기준 상위, 그룹당 1개)
  const selectedGroups = new Set<string>();
  const diverseRecommendations: ImageAnalysisData[] = [];
  
  for (const image of enrichedImages) {
    if (!image.similarityGroups || image.similarityGroups.length === 0) {
      if (diverseRecommendations.length < 5) {
        diverseRecommendations.push(image);
      }
      continue;
    }
    
    // 아직 선택되지 않은 그룹에서 이미지 선택
    const groupKey = image.similarityGroups[0];
    if (!selectedGroups.has(groupKey) && (image.diversityScore || 0) >= (options.minDiversityScore || 0.3)) {
      selectedGroups.add(groupKey);
      diverseRecommendations.push(image);
      
      // 최대 5개까지만 선택
      if (diverseRecommendations.length >= 5) {
        break;
      }
    }
  }
  
  const result = {
    images: enrichedImages,
    similarityGroups,
    recommendations: {
      diverse: diverseRecommendations,
      byCategory: categorizedImages
    }
  };
  
  // 결과 캐싱
  await cacheImageAnalysis(cacheKey, result);
  
  return result;
}

/**
 * 다양한 이미지 세트 추천
 * 
 * @param images 이미지 분석 데이터 배열
 * @param options 다양성 분석 옵션
 * @returns 추천 이미지 세트
 */
export async function recommendDiverseImageSet(
  images: ImageAnalysisData[],
  options: DiversityOptions = {}
): Promise<{
  mainImages: ImageAnalysisData[];
  detailImages: ImageAnalysisData[];
  lifestyleImages: ImageAnalysisData[];
  allImages: ImageAnalysisData[];
}> {
  // 다양성 분석 수행
  const diversityAnalysis = await analyzeImageDiversity(images, options);
  
  // 기본값 설정
  const targetCategories = options.targetCategories || {
    main: 1,
    detail: 3,
    lifestyle: 1,
    specification: 1
  };
  
  // 카테고리별 이미지 선택
  const mainImages = diversityAnalysis.recommendations.byCategory.main.slice(0, targetCategories.main || 1);
  const detailImages = diversityAnalysis.recommendations.byCategory.detail.slice(0, targetCategories.detail || 3);
  const lifestyleImages = diversityAnalysis.recommendations.byCategory.lifestyle.slice(0, targetCategories.lifestyle || 1);
  const specImages = diversityAnalysis.recommendations.byCategory.specification.slice(0, targetCategories.specification || 1);
  
  // 선택된 모든 이미지
  const allSelectedImages = [
    ...mainImages,
    ...detailImages,
    ...lifestyleImages,
    ...specImages
  ];
  
  // 카테고리별 이미지가 충분하지 않은 경우, 종합 점수 기준으로 추가
  if (allSelectedImages.length < 5) {
    const additionalImages = diversityAnalysis.recommendations.diverse
      .filter(img => !allSelectedImages.some(selected => selected.imageUrl === img.imageUrl))
      .slice(0, 5 - allSelectedImages.length);
    
    allSelectedImages.push(...additionalImages);
  }
  
  return {
    mainImages,
    detailImages,
    lifestyleImages,
    allImages: allSelectedImages
  };
} 