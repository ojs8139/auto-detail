/**
 * 이미지 섹션 매칭 서비스
 * 상세페이지의 다양한 섹션에 맞는 이미지를 자동으로 선택하고 배치하는 기능을 제공합니다.
 */

import { ImageAnalysisData } from './imageDiversityService';
import { ImageContentAnalysis } from './imageContentAnalysisService';

/**
 * 상세페이지 섹션 타입 정의
 */
export enum PageSection {
  HERO = 'hero',           // 상단 대표 이미지
  FEATURES = 'features',   // 제품 특징/장점
  DETAILS = 'details',     // 제품 상세 설명
  USAGE = 'usage',         // 사용 방법
  SPECS = 'specs',         // 제품 스펙/사양
  GALLERY = 'gallery',     // 갤러리/추가 이미지
  LIFESTYLE = 'lifestyle', // 라이프스타일/사용 장면
  ACCESSORIES = 'accessories', // 액세서리/관련 제품
  COMPARISON = 'comparison' // 비교/대조 이미지
}

/**
 * 섹션 매칭 설정 인터페이스
 */
export interface SectionMatchingOptions {
  // 각 섹션별 필요한 이미지 수
  sectionCounts: {
    [key in PageSection]?: number;
  };
  // 이미지 크기 선호도 (큰 이미지를 선호하는 섹션 지정)
  preferLargeImages?: PageSection[];
  // 이미지 품질 가중치 (0~1)
  qualityWeight?: number;
  // 내용 관련성 가중치 (0~1)
  relevanceWeight?: number;
  // 다양성 가중치 (0~1)
  diversityWeight?: number;
}

/**
 * 섹션별 이미지 매칭 결과 인터페이스
 */
export interface SectionMatchingResult {
  [key: string]: ImageAnalysisData[] | undefined;
}

/**
 * 섹션별 이미지 추천 점수 계산
 * 
 * @param image 이미지 분석 데이터
 * @param section 페이지 섹션
 * @param options 매칭 옵션
 * @returns 추천 점수 (0~1)
 */
function calculateSectionScore(
  image: ImageAnalysisData,
  section: PageSection,
  options: SectionMatchingOptions
): number {
  if (!image.content) return 0;
  
  const content = image.content;
  let score = 0;
  
  // 1. 섹션 관련성 점수 (0~0.5)
  const sectionRelevance = getSectionRelevanceScore(content, section);
  
  // 2. 이미지 품질 점수 (0~0.3)
  const qualityScore = image.quality ? 
    (image.quality.overall?.score || 0) * 0.3 : 0;
  
  // 3. 다양성 점수 (0~0.2)
  const diversityScore = (image.diversityScore || 0) * 0.2;
  
  // 가중치 적용
  const qualityWeight = options.qualityWeight || 0.3;
  const relevanceWeight = options.relevanceWeight || 0.5;
  const diversityWeight = options.diversityWeight || 0.2;
  
  // 총점 계산 (가중치 합은 1)
  score = (sectionRelevance * relevanceWeight) + 
          (qualityScore * qualityWeight) + 
          (diversityScore * diversityWeight);
  
  // 큰 이미지 선호 섹션에 대한 보너스 점수
  if (options.preferLargeImages?.includes(section) && 
      image.quality?.resolution) {
    const { width, height } = image.quality.resolution;
    const area = width * height;
    // 100만 픽셀 이상인 경우 보너스 점수 추가 (최대 0.1)
    if (area > 1000000) {
      const sizeBonus = Math.min(0.1, (area - 1000000) / 10000000 * 0.1);
      score += sizeBonus;
    }
  }
  
  return Math.min(1, Math.max(0, score)); // 0~1 범위로 제한
}

/**
 * 이미지 내용과 섹션 간의 관련성 점수 계산
 * 
 * @param content 이미지 내용 분석 결과
 * @param section 페이지 섹션
 * @returns 관련성 점수 (0~0.5)
 */
function getSectionRelevanceScore(
  content: ImageContentAnalysis,
  section: PageSection
): number {
  // 기본 점수
  let score = 0;
  
  // 1. 이미지 추천 섹션 직접 매칭 (최대 0.3점)
  if (content.recommendedUse && content.recommendedUse.section) {
    const recommendedSection = content.recommendedUse.section.toLowerCase();
    
    // 섹션별 키워드 매칭
    switch (section) {
      case PageSection.HERO:
        if (recommendedSection.includes('main') || 
            recommendedSection.includes('hero') ||
            recommendedSection.includes('cover')) {
          score += 0.3;
        }
        break;
        
      case PageSection.FEATURES:
        if (recommendedSection.includes('feature') || 
            recommendedSection.includes('highlight') ||
            recommendedSection.includes('benefit')) {
          score += 0.3;
        }
        break;
        
      case PageSection.DETAILS:
        if (recommendedSection.includes('detail') || 
            recommendedSection.includes('close') ||
            recommendedSection.includes('zoom')) {
          score += 0.3;
        }
        break;
        
      case PageSection.USAGE:
        if (recommendedSection.includes('usage') || 
            recommendedSection.includes('how to') ||
            recommendedSection.includes('tutorial') ||
            recommendedSection.includes('instruction')) {
          score += 0.3;
        }
        break;
        
      case PageSection.SPECS:
        if (recommendedSection.includes('spec') || 
            recommendedSection.includes('technical') ||
            recommendedSection.includes('dimension') ||
            recommendedSection.includes('measurement')) {
          score += 0.3;
        }
        break;
        
      case PageSection.GALLERY:
        if (recommendedSection.includes('gallery') || 
            recommendedSection.includes('additional') ||
            recommendedSection.includes('more')) {
          score += 0.3;
        }
        break;
        
      case PageSection.LIFESTYLE:
        if (recommendedSection.includes('lifestyle') || 
            recommendedSection.includes('context') ||
            recommendedSection.includes('environment') ||
            recommendedSection.includes('use case')) {
          score += 0.3;
        }
        break;
        
      case PageSection.ACCESSORIES:
        if (recommendedSection.includes('accessory') || 
            recommendedSection.includes('add-on') ||
            recommendedSection.includes('related') ||
            recommendedSection.includes('bundle')) {
          score += 0.3;
        }
        break;
        
      case PageSection.COMPARISON:
        if (recommendedSection.includes('compare') || 
            recommendedSection.includes('versus') ||
            recommendedSection.includes('contrast') ||
            recommendedSection.includes('difference')) {
          score += 0.3;
        }
        break;
    }
  }
  
  // 2. 태그 기반 관련성 (최대 0.2점)
  if (content.mood && content.mood.tags) {
    const tags = content.mood.tags.map(t => t.toLowerCase());
    
    // 섹션별 관련 태그 정의
    const sectionTags: { [key in PageSection]: string[] } = {
      [PageSection.HERO]: ['main', 'primary', 'key', 'hero', 'cover', 'showcase', 'display'],
      [PageSection.FEATURES]: ['feature', 'highlight', 'benefit', 'advantage', 'selling point', 'unique'],
      [PageSection.DETAILS]: ['detail', 'close-up', 'zoom', 'texture', 'material', 'part', 'component'],
      [PageSection.USAGE]: ['usage', 'use', 'demonstration', 'tutorial', 'how to', 'step', 'instruction'],
      [PageSection.SPECS]: ['specification', 'technical', 'spec', 'measurement', 'dimension', 'size', 'weight'],
      [PageSection.GALLERY]: ['gallery', 'collection', 'variety', 'assortment', 'angle', 'view'],
      [PageSection.LIFESTYLE]: ['lifestyle', 'context', 'environment', 'scenario', 'real-world', 'application'],
      [PageSection.ACCESSORIES]: ['accessory', 'complement', 'add-on', 'extra', 'related', 'companion'],
      [PageSection.COMPARISON]: ['compare', 'versus', 'contrast', 'comparison', 'alternative', 'option', 'side-by-side']
    };
    
    // 해당 섹션의 태그와 일치하는 수 계산
    const sectionTagList = sectionTags[section] || [];
    let matchCount = 0;
    
    for (const tag of tags) {
      if (sectionTagList.some(sectionTag => tag.includes(sectionTag))) {
        matchCount++;
      }
    }
    
    // 태그 매칭 점수 계산 (매칭당 0.05점, 최대 0.2점)
    score += Math.min(0.2, matchCount * 0.05);
  }
  
  return score;
}

/**
 * 섹션별 이미지 매칭 및 추천
 * 
 * @param images 이미지 분석 데이터 배열
 * @param options 매칭 옵션
 * @returns 섹션별 이미지 매칭 결과
 */
export async function matchImagesToSections(
  images: ImageAnalysisData[],
  options: SectionMatchingOptions
): Promise<SectionMatchingResult> {
  // 결과 객체 초기화
  const result: SectionMatchingResult = {};
  
  // 이미지가 없으면 빈 결과 반환
  if (!images || images.length === 0) {
    return result;
  }
  
  // 각 이미지에 대해 섹션별 점수 계산
  const sectionScores: { [key in PageSection]?: { image: ImageAnalysisData; score: number }[] } = {};
  
  // 모든 섹션에 대한 점수 계산
  Object.values(PageSection).forEach(section => {
    sectionScores[section] = images.map(image => ({
      image,
      score: calculateSectionScore(image, section, options)
    }))
    .sort((a, b) => b.score - a.score); // 높은 점수 순으로 정렬
  });
  
  // 섹션별로 상위 이미지 선택
  Object.entries(options.sectionCounts).forEach(([section, count]) => {
    const sectionKey = section as PageSection;
    const scores = sectionScores[sectionKey] || [];
    
    // 지정된 수 만큼 이미지 선택
    result[sectionKey] = scores
      .slice(0, count)
      .filter(item => item.score > 0.3) // 최소 점수 임계값 적용
      .map(item => item.image);
  });
  
  return result;
}

/**
 * 추천된 섹션 매칭 결과에서 중복 이미지 제거
 * 우선순위가 높은 섹션에 이미지를 유지하고 낮은 섹션에서 제거합니다.
 * 
 * @param matchingResult 섹션 매칭 결과
 * @param sectionPriority 섹션 우선순위 (높은 순)
 * @returns 중복 제거된 매칭 결과
 */
export function removeDuplicateImages(
  matchingResult: SectionMatchingResult,
  sectionPriority: PageSection[] = [
    PageSection.HERO,
    PageSection.FEATURES,
    PageSection.DETAILS,
    PageSection.USAGE,
    PageSection.SPECS,
    PageSection.LIFESTYLE,
    PageSection.ACCESSORIES,
    PageSection.GALLERY,
    PageSection.COMPARISON
  ]
): SectionMatchingResult {
  // 결과 복사
  const result: SectionMatchingResult = JSON.parse(JSON.stringify(matchingResult));
  
  // 사용된 이미지 URL 추적
  const usedImageUrls = new Set<string>();
  
  // 우선순위에 따라 처리
  for (const section of sectionPriority) {
    if (!result[section]) continue;
    
    // 현재 섹션에서 이미 사용된 이미지 필터링
    result[section] = result[section]?.filter(image => {
      if (usedImageUrls.has(image.imageUrl)) {
        return false; // 이미 사용된 이미지는 제외
      }
      
      // 이미지 URL 추적
      usedImageUrls.add(image.imageUrl);
      return true;
    });
  }
  
  return result;
}

/**
 * 섹션별 이미지 배치 레이아웃 추천
 * 이미지 비율, 방향, 내용 등을 고려하여 최적의 레이아웃을 추천합니다.
 * 
 * @param sectionImages 섹션별 이미지 배열
 * @param section 페이지 섹션
 * @returns 추천 레이아웃 정보
 */
export function recommendSectionLayout(
  sectionImages: ImageAnalysisData[],
  section: PageSection
): {
  layout: 'grid' | 'slider' | 'mosaic' | 'single' | 'comparison';
  columns?: number;
  imageOrder?: number[];
} {
  if (!sectionImages || sectionImages.length === 0) {
    return { layout: 'single' };
  }
  
  // 이미지 수에 따른 기본 레이아웃
  const imageCount = sectionImages.length;
  
  if (imageCount === 1) {
    return { layout: 'single' };
  }
  
  // 섹션별 기본 레이아웃 추천
  switch (section) {
    case PageSection.HERO:
      return { layout: 'slider' };
      
    case PageSection.FEATURES:
      return { 
        layout: 'grid',
        columns: Math.min(3, imageCount)
      };
      
    case PageSection.DETAILS:
      return { layout: 'mosaic' };
      
    case PageSection.GALLERY:
      return { layout: 'grid', columns: 3 };
      
    case PageSection.COMPARISON:
      return { layout: 'comparison' };
      
    case PageSection.LIFESTYLE:
      return { layout: 'slider' };
      
    default:
      // 기본값: 2-3개는 그리드, 그 이상은 슬라이더
      return { 
        layout: imageCount <= 3 ? 'grid' : 'slider',
        columns: imageCount <= 3 ? imageCount : undefined
      };
  }
}

/**
 * 전체 섹션 매칭 파이프라인 실행
 * 
 * @param images 이미지 분석 데이터 배열
 * @param options 매칭 옵션
 * @returns 최종 매칭 및 레이아웃 결과
 */
export async function processSectionMatching(
  images: ImageAnalysisData[],
  options: Partial<SectionMatchingOptions> = {}
): Promise<{
  matchingResult: SectionMatchingResult;
  layoutRecommendations: { [key in PageSection]?: any };
}> {
  // 기본 옵션 설정
  const defaultOptions: SectionMatchingOptions = {
    sectionCounts: {
      [PageSection.HERO]: 1,
      [PageSection.FEATURES]: 3,
      [PageSection.DETAILS]: 4,
      [PageSection.USAGE]: 2,
      [PageSection.SPECS]: 1,
      [PageSection.GALLERY]: 6,
      [PageSection.LIFESTYLE]: 2
    },
    preferLargeImages: [PageSection.HERO, PageSection.FEATURES],
    qualityWeight: 0.3,
    relevanceWeight: 0.5,
    diversityWeight: 0.2
  };
  
  // 사용자 옵션과 기본 옵션 병합
  const mergedOptions: SectionMatchingOptions = {
    ...defaultOptions,
    ...options,
    sectionCounts: {
      ...defaultOptions.sectionCounts,
      ...(options.sectionCounts || {})
    }
  };
  
  // 섹션별 이미지 매칭 실행
  const matchingResult = await matchImagesToSections(images, mergedOptions);
  
  // 중복 이미지 제거
  const dedupedResult = removeDuplicateImages(matchingResult);
  
  // 섹션별 레이아웃 추천
  const layoutRecommendations: { [key in PageSection]?: any } = {};
  
  Object.entries(dedupedResult).forEach(([section, sectionImages]) => {
    if (sectionImages && sectionImages.length > 0) {
      layoutRecommendations[section as PageSection] = 
        recommendSectionLayout(sectionImages, section as PageSection);
    }
  });
  
  return {
    matchingResult: dedupedResult,
    layoutRecommendations
  };
} 