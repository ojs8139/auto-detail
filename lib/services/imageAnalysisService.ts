/**
 * 이미지 분석 서비스
 * 이미지에서 스타일 요소와 색상 등을 추출하는 기능을 제공합니다.
 */

/**
 * 이미지에서 추출한 색상 정보 인터페이스
 */
export interface ColorInfo {
  color: string;
  percentage: number;
  isNeutral?: boolean;
}

/**
 * 이미지에서 추출한 스타일 요소 인터페이스
 */
export interface StyleElement {
  type: 'pattern' | 'shape' | 'texture' | 'layout';
  name: string;
  confidence: number;
}

/**
 * 이미지 분석 결과 인터페이스
 */
export interface ImageAnalysisResult {
  imageUrl: string;
  dominantColors: ColorInfo[];
  styleElements?: StyleElement[];
  tags?: string[];
  brightness?: number; // 0-1 (어두움-밝음)
  contrast?: number; // 0-1 (낮음-높음)
  saturation?: number; // 0-1 (낮음-높음)
}

/**
 * 16진수 색상 코드를 RGB 값으로 변환합니다.
 * @param hex 16진수 색상 코드
 * @returns RGB 값 객체
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // 16진수 색상 코드 정규식 확인
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  
  if (!result) {
    // 3자리 16진수 색상 코드 확인 (#rgb)
    const shorthandResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    
    if (shorthandResult) {
      return {
        r: parseInt(shorthandResult[1] + shorthandResult[1], 16),
        g: parseInt(shorthandResult[2] + shorthandResult[2], 16),
        b: parseInt(shorthandResult[3] + shorthandResult[3], 16)
      };
    }
    
    return null;
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  };
}

/**
 * RGB 값을 16진수 색상 코드로 변환합니다.
 * @param r 빨간색 값 (0-255)
 * @param g 녹색 값 (0-255)
 * @param b 파란색 값 (0-255)
 * @returns 16진수 색상 코드
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * 색상의 중립성(무채색에 가까운 정도)을 판단합니다.
 * @param r 빨간색 값 (0-255)
 * @param g 녹색 값 (0-255)
 * @param b 파란색 값 (0-255)
 * @returns 중립성 여부
 */
export function isNeutralColor(r: number, g: number, b: number): boolean {
  // RGB 값의 차이가 작으면 무채색에 가깝다고 판단
  const maxDiff = Math.max(
    Math.abs(r - g),
    Math.abs(r - b),
    Math.abs(g - b)
  );
  
  return maxDiff < 30; // 차이가 30 미만이면 무채색으로 간주
}

/**
 * 색상 배열에서 유사한 색상을 그룹화합니다.
 * @param colors 색상 배열
 * @param threshold 유사도 임계값 (낮을수록 더 많은 그룹이 생성됨)
 * @returns 그룹화된 색상 배열
 */
export function groupSimilarColors(colors: string[], threshold: number = 30): string[] {
  const groups: string[][] = [];
  
  colors.forEach((color) => {
    const rgb1 = hexToRgb(color);
    if (!rgb1) return;
    
    // 기존 그룹에 추가할 수 있는지 확인
    const groupIndex = groups.findIndex((group) => {
      const representativeColor = group[0];
      const rgb2 = hexToRgb(representativeColor);
      if (!rgb2) return false;
      
      const distance = Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
      );
      
      return distance <= threshold;
    });
    
    if (groupIndex !== -1) {
      // 기존 그룹에 추가
      groups[groupIndex].push(color);
    } else {
      // 새 그룹 생성
      groups.push([color]);
    }
  });
  
  // 각 그룹에서 대표 색상 선택 (첫 번째 색상)
  return groups.map(group => group[0]);
}

/**
 * 추출된 색상에서 주요 색상을 식별합니다.
 * @param colors 추출된 모든 색상 배열
 * @returns 주요 색상 정보 배열
 */
export function identifyDominantColors(colors: string[]): ColorInfo[] {
  // 색상 빈도 계산
  const colorCounts: Record<string, number> = {};
  colors.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  
  // 빈도순으로 정렬
  const sortedColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([color, count]) => ({
      color,
      percentage: (count / colors.length) * 100,
      isNeutral: isNeutralColorByHex(color)
    }));
  
  // 상위 5개 색상 또는 전체 색상의 10% 이상을 차지하는 색상 반환
  return sortedColors
    .filter((color, index) => index < 5 || color.percentage >= 10)
    .slice(0, 10); // 최대 10개로 제한
}

/**
 * 16진수 색상 코드로 중립성 여부를 판단합니다.
 * @param hex 16진수 색상 코드
 * @returns 중립성 여부
 */
function isNeutralColorByHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  return isNeutralColor(rgb.r, rgb.g, rgb.b);
}

/**
 * 이미지 URL에서 지원하는 이미지 형식인지 확인합니다.
 * @param url 이미지 URL
 * @returns 지원 여부
 */
export function isSupportedImageFormat(url: string): boolean {
  const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const lowercaseUrl = url.toLowerCase();
  
  return supportedExtensions.some(ext => lowercaseUrl.endsWith(ext));
}

/**
 * 이미지 URL 배열에서 스타일 분석에 적합한 이미지만 필터링합니다.
 * @param imageUrls 이미지 URL 배열
 * @returns 필터링된 이미지 URL 배열
 */
export function filterRelevantImages(imageUrls: string[]): string[] {
  return imageUrls.filter(url => {
    // 지원하는 이미지 형식인지 확인
    if (!isSupportedImageFormat(url)) return false;
    
    // 필터링 조건 (예: 작은 아이콘, 배너 이미지 등 제외)
    const isLikelyIcon = url.includes('icon') || url.includes('logo');
    const isLikelyBanner = url.includes('banner') || url.includes('ad');
    
    return !isLikelyIcon && !isLikelyBanner;
  });
}

/**
 * 색상 팔레트를 생성합니다.
 * @param dominantColors 주요 색상 정보 배열
 * @returns 색상 팔레트 객체
 */
export function generateColorPalette(dominantColors: ColorInfo[]): {
  primary: string[];
  secondary: string[];
  accent: string[];
  background: string[];
} {
  // 색상 분류
  const neutralColors: string[] = [];
  const vibrantColors: string[] = [];
  
  dominantColors.forEach(colorInfo => {
    if (colorInfo.isNeutral) {
      neutralColors.push(colorInfo.color);
    } else {
      vibrantColors.push(colorInfo.color);
    }
  });
  
  // 팔레트 생성 (사용 가능한 색상이 충분하지 않을 경우 기본값 사용)
  return {
    primary: vibrantColors.slice(0, 2),
    secondary: vibrantColors.slice(2, 4),
    accent: vibrantColors.slice(4, 5),
    background: neutralColors.slice(0, 2),
  };
}

/**
 * 이미지 메타데이터를 기반으로 이미지 유형을 추정합니다.
 * @param url 이미지 URL
 * @param size 이미지 크기 (있는 경우)
 * @returns 이미지 유형 추정
 */
export function estimateImageType(url: string, size?: { width: number, height: number }): string {
  // URL 기반 유형 추정
  const filename = url.split('/').pop()?.toLowerCase() || '';
  
  if (filename.includes('product') || filename.includes('item') || filename.includes('goods')) {
    return 'product';
  }
  
  if (filename.includes('banner') || filename.includes('slide') || filename.includes('hero') || filename.includes('main')) {
    return 'banner';
  }
  
  if (filename.includes('bg') || filename.includes('background') || filename.includes('backdrop')) {
    return 'background';
  }
  
  if (filename.includes('icon') || filename.includes('logo') || filename.includes('symbol')) {
    return 'icon';
  }

  if (filename.includes('detail') || filename.includes('desc') || filename.includes('info')) {
    return 'detail';
  }

  if (filename.includes('model') || filename.includes('person') || filename.includes('avatar')) {
    return 'model';
  }
  
  // 크기 기반 유형 추정
  if (size) {
    const { width, height } = size;
    const ratio = width / height;
    
    if (ratio > 2.5) {
      return 'banner';
    }
    
    if (ratio < 0.5) {
      return 'vertical-banner';
    }
    
    if (width < 100 && height < 100) {
      return 'icon';
    }
    
    if (width > 800 && height > 400) {
      return 'hero';
    }

    if (width === height || Math.abs(width - height) < 20) {
      return 'square-image';
    }

    if (width > height * 3) {
      return 'panorama';
    }
  }
  
  return 'unknown';
}

/**
 * 이미지에서 스타일 요소를 추출합니다. 이 기능은 클라이언트 측에서만 실행할 수 있습니다.
 * 서버 측에서는 OpenAI API 등을 활용해 분석해야 합니다.
 * @param imageUrl 이미지 URL
 * @returns 스타일 요소 배열 (Promise)
 */
export async function extractStyleElements(imageUrl: string): Promise<StyleElement[]> {
  try {
    // 이미지 URL 분석으로 패턴 추정
    const filename = imageUrl.split('/').pop()?.toLowerCase() || '';
    const styleElements: StyleElement[] = [];
    
    // 패턴 감지 - 확장된 패턴 목록
    const patternKeywords = [
      'pattern', 'texture', 'stripe', 'check', 'dot', 'floral', 'geometric', 
      'grid', 'wave', 'abstract', 'repeat', 'motif', 'chevron', 'herringbone'
    ];
    
    for (const keyword of patternKeywords) {
      if (filename.includes(keyword)) {
        styleElements.push({
          type: 'pattern',
          name: keyword,
          confidence: 0.85
        });
        break; // 가장 먼저 발견된 패턴만 추가
      }
    }
    
    // 모양 감지 - 확장된 모양 목록
    const shapeMap: Record<string, string> = {
      'round': 'circular',
      'circle': 'circular',
      'oval': 'elliptical',
      'square': 'rectangular',
      'box': 'rectangular',
      'rect': 'rectangular',
      'triangle': 'triangular',
      'diamond': 'diamond',
      'star': 'star-shaped',
      'heart': 'heart-shaped',
      'hexagon': 'hexagonal',
      'organic': 'organic',
      'curved': 'curved'
    };
    
    for (const [keyword, shapeName] of Object.entries(shapeMap)) {
      if (filename.includes(keyword)) {
        styleElements.push({
          type: 'shape',
          name: shapeName,
          confidence: 0.9
        });
        break; // 가장 먼저 발견된 모양만 추가
      }
    }
    
    // 텍스처 감지 - 확장된 텍스처 목록
    const textureMap: Record<string, string> = {
      'wood': 'wooden',
      'stone': 'stone',
      'fabric': 'fabric',
      'leather': 'leather',
      'metal': 'metallic',
      'glass': 'glass',
      'marble': 'marble',
      'concrete': 'concrete',
      'paper': 'paper',
      'silk': 'silky',
      'cotton': 'cotton',
      'velvet': 'velvet',
      'denim': 'denim',
      'knit': 'knitted',
      'rubber': 'rubber',
      'plastic': 'plastic'
    };
    
    for (const [keyword, textureName] of Object.entries(textureMap)) {
      if (filename.includes(keyword)) {
        styleElements.push({
          type: 'texture',
          name: textureName,
          confidence: 0.85
        });
        break; // 가장 먼저 발견된 텍스처만 추가
      }
    }
    
    // 레이아웃 감지 - 이미지 유형 기반
    const imageType = estimateImageType(imageUrl);
    
    const layoutMap: Record<string, string> = {
      'banner': 'horizontal-banner',
      'vertical-banner': 'vertical-banner',
      'hero': 'hero-section',
      'product': 'product-showcase',
      'detail': 'detail-view',
      'background': 'background-texture',
      'icon': 'icon-element',
      'model': 'model-showcase',
      'square-image': 'square-composition',
      'panorama': 'panoramic-view'
    };
    
    if (layoutMap[imageType]) {
      styleElements.push({
        type: 'layout',
        name: layoutMap[imageType],
        confidence: 0.8
      });
    }
    
    // 파일명에서 추가 스타일 힌트 추출
    const styleHints = [
      { keywords: ['minimal', 'clean', 'simple'], type: 'pattern', name: 'minimalist' },
      { keywords: ['retro', 'vintage', 'old'], type: 'pattern', name: 'retro' },
      { keywords: ['modern', 'contemporary'], type: 'pattern', name: 'modern' },
      { keywords: ['luxury', 'premium', 'elegant'], type: 'pattern', name: 'luxury' },
      { keywords: ['casual', 'everyday'], type: 'pattern', name: 'casual' },
      { keywords: ['bright', 'vibrant', 'colorful'], type: 'pattern', name: 'vibrant' },
      { keywords: ['dark', 'moody'], type: 'pattern', name: 'moody' },
      { keywords: ['cute', 'kawaii'], type: 'pattern', name: 'cute' }
    ];
    
    for (const hint of styleHints) {
      for (const keyword of hint.keywords) {
        if (filename.includes(keyword)) {
          styleElements.push({
            type: hint.type as 'pattern',
            name: hint.name,
            confidence: 0.75
          });
          break;
        }
      }
    }
    
    return styleElements;
  } catch (error) {
    console.error('스타일 요소 추출 실패:', error);
    return [];
  }
}

/**
 * 이미지에서 주요 특징을 분석합니다.
 * @param imageUrl 이미지 URL
 * @returns 이미지 분석 결과 (Promise)
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult | null> {
  try {
    // 실제 구현에서는 이미지 분석 API나 머신러닝 모델을 사용해야 합니다.
    // 여기서는 URL 기반 추정을 통한 예시를 보여줍니다.
    
    // 간단한 색상 추정 (실제로는 이미지 처리 필요)
    const mockDominantColors: ColorInfo[] = [
      { color: '#f8f8f8', percentage: 35, isNeutral: true },
      { color: '#2c2c2c', percentage: 25, isNeutral: true },
      { color: '#e74c3c', percentage: 15, isNeutral: false },
      { color: '#3498db', percentage: 10, isNeutral: false },
      { color: '#2ecc71', percentage: 8, isNeutral: false },
    ];
    
    // 스타일 요소 추출
    const styleElements = await extractStyleElements(imageUrl);
    
    // 이미지 유형 기반 태그 생성
    const imageType = estimateImageType(imageUrl);
    const tags = [imageType];
    
    if (imageType === 'product') {
      tags.push('merchandise', 'item', 'goods');
    } else if (imageType === 'banner') {
      tags.push('promotion', 'advertisement', 'showcase');
    } else if (imageType === 'background') {
      tags.push('texture', 'wallpaper', 'backdrop');
    } else if (imageType === 'model') {
      tags.push('person', 'fashion', 'outfit');
    } else if (imageType === 'detail') {
      tags.push('closeup', 'feature', 'specification');
    }
    
    // 파일명에서 추가 태그 추출
    const filename = imageUrl.split('/').pop()?.toLowerCase() || '';
    const words = filename.replace(/[^a-zA-Z0-9]/g, ' ').split(' ');
    words.forEach(word => {
      if (word.length > 3 && !tags.includes(word)) {
        tags.push(word);
      }
    });
    
    // 이미지 휘도, 대비, 채도 추정 (실제로는 이미지 처리 필요)
    // 여기서는 파일명에서 힌트를 추출
    let brightness = 0.7; // 기본값
    let contrast = 0.6;   // 기본값
    let saturation = 0.8; // 기본값
    
    if (filename.includes('dark') || filename.includes('black') || filename.includes('night')) {
      brightness = 0.3;
    } else if (filename.includes('light') || filename.includes('white') || filename.includes('bright')) {
      brightness = 0.9;
    }
    
    if (filename.includes('vibrant') || filename.includes('colorful') || filename.includes('saturated')) {
      saturation = 0.9;
    } else if (filename.includes('muted') || filename.includes('desaturated') || filename.includes('pastel')) {
      saturation = 0.4;
    }
    
    if (filename.includes('high-contrast') || filename.includes('contrast')) {
      contrast = 0.9;
    } else if (filename.includes('low-contrast') || filename.includes('soft')) {
      contrast = 0.4;
    }
    
    return {
      imageUrl,
      dominantColors: mockDominantColors,
      styleElements,
      tags,
      brightness,
      contrast,
      saturation
    };
  } catch (error) {
    console.error('이미지 분석 실패:', error);
    return null;
  }
}

/**
 * 다수의 이미지를 분석하고 결과를 배열로 반환합니다.
 * @param imageUrls 이미지 URL 배열
 * @returns 이미지 분석 결과 배열 (Promise)
 */
export async function analyzeMultipleImages(imageUrls: string[]): Promise<ImageAnalysisResult[]> {
  try {
    // 병렬로 이미지 분석 실행 (최대 10개 이미지만 처리)
    const analysisPromises = imageUrls.slice(0, 10).map(url => analyzeImage(url));
    const results = await Promise.all(analysisPromises);
    
    // null 결과 필터링
    return results.filter((result): result is ImageAnalysisResult => result !== null);
  } catch (error) {
    console.error('다수 이미지 분석 실패:', error);
    return [];
  }
}

/**
 * 분석된 이미지들에서 공통 스타일 특징을 추출합니다.
 * @param analysisResults 이미지 분석 결과 배열
 * @returns 공통 스타일 특징 또는 null
 */
export function extractCommonStyleFeatures(analysisResults: ImageAnalysisResult[]): {
  dominantColors: ColorInfo[];
  styleElements: Array<StyleElement & { frequency: number }>;
  commonTags: string[];
  avgBrightness: number;
  avgContrast: number;
  avgSaturation: number;
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
  };
} | null {
  if (analysisResults.length === 0) {
    return null;
  }
  
  // 모든 색상 수집
  const allColors: ColorInfo[] = [];
  analysisResults.forEach(result => {
    allColors.push(...result.dominantColors);
  });
  
  // 색상 병합 및 빈도 계산
  const colorFrequency: Record<string, { count: number, percentage: number, isNeutral?: boolean }> = {};
  allColors.forEach(colorInfo => {
    if (!colorFrequency[colorInfo.color]) {
      colorFrequency[colorInfo.color] = {
        count: 0,
        percentage: 0,
        isNeutral: colorInfo.isNeutral
      };
    }
    colorFrequency[colorInfo.color].count += 1;
    colorFrequency[colorInfo.color].percentage += colorInfo.percentage;
  });
  
  // 평균 백분율 계산 및 정렬
  Object.keys(colorFrequency).forEach(color => {
    colorFrequency[color].percentage /= colorFrequency[color].count;
  });
  
  // 빈도순 정렬
  const sortedColors = Object.entries(colorFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([color, info]) => ({
      color,
      percentage: info.percentage,
      isNeutral: info.isNeutral
    }));
  
  // 스타일 요소 수집 및 빈도 계산
  const styleElementFrequency: Record<string, { count: number, confidence: number }> = {};
  analysisResults.forEach(result => {
    if (result.styleElements) {
      result.styleElements.forEach(element => {
        const key = `${element.type}:${element.name}`;
        if (!styleElementFrequency[key]) {
          styleElementFrequency[key] = { count: 0, confidence: 0 };
        }
        styleElementFrequency[key].count += 1;
        styleElementFrequency[key].confidence += element.confidence;
      });
    }
  });
  
  // 평균 신뢰도 계산 및 정렬
  Object.keys(styleElementFrequency).forEach(key => {
    styleElementFrequency[key].confidence /= styleElementFrequency[key].count;
  });
  
  // 빈도순 정렬
  const sortedStyleElements = Object.entries(styleElementFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, info]) => {
      const [type, name] = key.split(':');
      return {
        type: type as 'pattern' | 'shape' | 'texture' | 'layout',
        name,
        confidence: info.confidence,
        frequency: info.count / analysisResults.length
      };
    });
  
  // 태그 빈도 계산
  const tagFrequency: Record<string, number> = {};
  analysisResults.forEach(result => {
    if (result.tags) {
      result.tags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    }
  });
  
  // 빈도순 정렬
  const sortedTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({
      tag,
      frequency: count / analysisResults.length
    }));
  
  // 평균 밝기, 대비, 채도 계산
  const avgBrightness = analysisResults.reduce((sum, result) => sum + (result.brightness || 0), 0) / analysisResults.length;
  const avgContrast = analysisResults.reduce((sum, result) => sum + (result.contrast || 0), 0) / analysisResults.length;
  const avgSaturation = analysisResults.reduce((sum, result) => sum + (result.saturation || 0), 0) / analysisResults.length;
  
  return {
    dominantColors: sortedColors.slice(0, 10),
    styleElements: sortedStyleElements.slice(0, 10),
    commonTags: sortedTags.filter(tag => tag.frequency > 0.3).map(tag => tag.tag),
    avgBrightness,
    avgContrast,
    avgSaturation,
    colorPalette: generateColorPalette(sortedColors.slice(0, 10))
  };
} 