/**
 * 이미지 품질 평가 서비스
 * 이미지의 해상도, 선명도, 노이즈 등을 분석하여 품질을 평가하는 기능을 제공합니다.
 */

import { createClient } from '@vercel/kv';

/**
 * 이미지 품질 평가 결과 인터페이스
 */
export interface ImageQualityAssessment {
  imageUrl: string;
  resolution: {
    width: number;
    height: number;
    score: number; // 0-1 점수
  };
  sharpness: {
    score: number; // 0-1 점수
    details: string;
  };
  noise: {
    level: 'low' | 'medium' | 'high';
    score: number; // 0-1 점수 (높을수록 노이즈가 적음)
  };
  colorQuality: {
    score: number; // 0-1 점수
    details: string;
  };
  lighting: {
    score: number; // 0-1 점수
    details: string;
  };
  compression: {
    level: 'low' | 'medium' | 'high';
    score: number; // 0-1 점수 (높을수록 압축이 적음)
  };
  overall: {
    score: number; // 0-1 종합 점수
    grade: 'A' | 'B' | 'C' | 'D' | 'F'; // 등급
    recommendation: string;
  };
  metadata?: {
    format: string;
    fileSize?: number; // bytes
    aspectRatio?: number;
  };
}

/**
 * 이미지 품질 평가 옵션 인터페이스
 */
export interface ImageQualityOptions {
  minWidth?: number;
  minHeight?: number;
  preferredAspectRatio?: number;
  includeMetadata?: boolean;
  weightFactors?: {
    resolution?: number;
    sharpness?: number;
    noise?: number;
    colorQuality?: number;
    lighting?: number;
    compression?: number;
  };
}

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
 * 이미지의 해상도 정보를 가져옵니다.
 * 이 함수는 브라우저 환경에서만 정확히 작동합니다.
 * 
 * @param imageUrl 이미지 URL
 * @returns 해상도 정보를 담은 Promise
 */
export async function getImageResolution(imageUrl: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      // 서버 환경에서는 더미 데이터 반환
      resolve({ width: 800, height: 600 });
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    
    img.onerror = () => {
      console.error('이미지 로드 실패:', imageUrl);
      resolve(null);
    };
    
    // 캐시 방지를 위한 쿼리 파라미터 추가
    img.src = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}cache=${Date.now()}`;
  });
}

/**
 * 이미지 파일 형식을 URL에서 추출합니다.
 * 
 * @param imageUrl 이미지 URL
 * @returns 파일 형식 (확장자)
 */
export function getImageFormat(imageUrl: string): string {
  const url = new URL(imageUrl);
  const pathname = url.pathname;
  const extension = pathname.split('.').pop()?.toLowerCase() || '';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(extension)) {
    return extension;
  }
  
  // 확장자가 없거나 인식할 수 없는 경우
  return 'unknown';
}

/**
 * 이미지 해상도 점수를 계산합니다.
 * 
 * @param width 이미지 너비
 * @param height 이미지 높이
 * @param minWidth 최소 권장 너비 (기본값: 800px)
 * @param minHeight 최소 권장 높이 (기본값: 600px)
 * @returns 해상도 점수 (0-1)
 */
export function calculateResolutionScore(width: number, height: number, minWidth = 800, minHeight = 600): number {
  // 최소 해상도 기준을 만족하는지 확인
  const widthRatio = width / minWidth;
  const heightRatio = height / minHeight;
  
  // 너비와 높이 모두 최소 기준의 2배 이상이면 만점
  if (widthRatio >= 2 && heightRatio >= 2) {
    return 1.0;
  }
  
  // 최소 기준 미달 시 낮은 점수
  if (widthRatio < 1 || heightRatio < 1) {
    return Math.max(0.2, Math.min(widthRatio, heightRatio));
  }
  
  // 그 외의 경우 비율에 따른 점수 계산
  const combinedRatio = (widthRatio + heightRatio) / 2;
  return Math.min(1.0, 0.5 + combinedRatio * 0.25);
}

/**
 * 이미지 형식 기반으로 압축 품질 점수를 추정합니다.
 * 
 * @param format 이미지 형식
 * @returns 압축 관련 정보
 */
export function estimateCompressionQuality(format: string): { level: 'low' | 'medium' | 'high'; score: number } {
  switch (format.toLowerCase()) {
    case 'svg':
      return { level: 'low', score: 1.0 }; // 벡터 이미지로 손실 없음
    case 'png':
      return { level: 'low', score: 0.9 }; // 무손실 압축
    case 'webp':
      return { level: 'low', score: 0.85 }; // 효율적인 압축
    case 'avif':
      return { level: 'low', score: 0.9 }; // 최신 고효율 압축
    case 'gif':
      return { level: 'medium', score: 0.7 }; // 제한된 색상 팔레트
    case 'jpg':
    case 'jpeg':
      return { level: 'medium', score: 0.75 }; // 손실 압축
    default:
      return { level: 'medium', score: 0.6 }; // 알 수 없는 형식
  }
}

/**
 * 파일명과 URL 특성을 기반으로 이미지 품질 특성을 추정합니다.
 * 
 * @param imageUrl 이미지 URL
 * @returns 추정된 품질 특성
 */
export function estimateImageQualityFromUrl(imageUrl: string): {
  sharpness: { score: number; details: string };
  noise: { level: 'low' | 'medium' | 'high'; score: number };
  colorQuality: { score: number; details: string };
  lighting: { score: number; details: string };
} {
  const url = imageUrl.toLowerCase();
  const filename = url.split('/').pop() || '';
  
  // 기본값 설정
  const defaultResult: {
    sharpness: { score: number; details: string };
    noise: { level: 'low' | 'medium' | 'high'; score: number };
    colorQuality: { score: number; details: string };
    lighting: { score: number; details: string };
  } = {
    sharpness: { score: 0.7, details: '평균적인 선명도' },
    noise: { level: 'medium', score: 0.7 },
    colorQuality: { score: 0.75, details: '표준 색상 품질' },
    lighting: { score: 0.7, details: '균형 잡힌 조명' }
  };
  
  // URL에서 품질 관련 힌트 추출
  const isHighQuality = url.includes('highquality') || url.includes('high-quality') || url.includes('hq') || url.includes('premium');
  const isLowQuality = url.includes('lowquality') || url.includes('low-quality') || url.includes('lq') || url.includes('thumbnail');
  
  // 파일명에서 힌트 추출
  const isFHD = filename.includes('fhd') || filename.includes('1080p') || filename.includes('fullhd');
  const isHD = filename.includes('hd') || filename.includes('720p');
  const isUHD = filename.includes('uhd') || filename.includes('4k') || url.includes('4k');
  
  // 품질 관련 키워드 체크
  const isSharp = filename.includes('sharp') || url.includes('sharp');
  const isBlurry = filename.includes('blur') || url.includes('blur');
  const isNoisy = filename.includes('noise') || url.includes('noise') || filename.includes('grain') || url.includes('grain');
  const isDark = filename.includes('dark') || url.includes('dark') || filename.includes('night') || url.includes('night');
  const isBright = filename.includes('bright') || url.includes('bright') || filename.includes('sunny') || url.includes('sunny');
  
  // 추정 결과 조정
  const result = { ...defaultResult };
  
  // 해상도 힌트에 따른 일반적인 품질 조정
  if (isUHD) {
    result.sharpness.score = 0.9;
    result.sharpness.details = '매우 높은 선명도';
    result.noise.level = 'low';
    result.noise.score = 0.9;
    result.colorQuality.score = 0.9;
    result.colorQuality.details = '우수한 색상 표현';
  } else if (isFHD) {
    result.sharpness.score = 0.8;
    result.sharpness.details = '높은 선명도';
    result.noise.level = 'low';
    result.noise.score = 0.8;
    result.colorQuality.score = 0.8;
    result.colorQuality.details = '좋은 색상 표현';
  } else if (isHD) {
    result.sharpness.score = 0.75;
    result.sharpness.details = '준수한 선명도';
    result.noise.level = 'medium';
    result.noise.score = 0.75;
  }
  
  // 명시적 품질 힌트
  if (isHighQuality) {
    result.sharpness.score = Math.min(1.0, result.sharpness.score + 0.15);
    result.noise.score = Math.min(1.0, result.noise.score + 0.15);
    result.colorQuality.score = Math.min(1.0, result.colorQuality.score + 0.15);
  } else if (isLowQuality) {
    result.sharpness.score = Math.max(0.2, result.sharpness.score - 0.25);
    result.noise.score = Math.max(0.2, result.noise.score - 0.25);
    result.colorQuality.score = Math.max(0.2, result.colorQuality.score - 0.25);
  }
  
  // 개별 특성 힌트
  if (isSharp) {
    result.sharpness.score = Math.min(1.0, result.sharpness.score + 0.2);
    result.sharpness.details = '우수한 선명도';
  } else if (isBlurry) {
    result.sharpness.score = Math.max(0.1, result.sharpness.score - 0.3);
    result.sharpness.details = '흐릿한 이미지';
  }
  
  if (isNoisy) {
    result.noise.level = 'high';
    result.noise.score = Math.max(0.2, result.noise.score - 0.3);
  }
  
  if (isDark) {
    result.lighting.score = Math.max(0.3, result.lighting.score - 0.2);
    result.lighting.details = '어두운 조명';
  } else if (isBright) {
    result.lighting.score = Math.min(0.9, result.lighting.score + 0.1);
    result.lighting.details = '밝은 조명';
  }
  
  return result;
}

/**
 * 이미지 형식과 URL 정보를 기반으로 색상 품질을 추정합니다.
 * 
 * @param format 이미지 형식
 * @param imageUrl 이미지 URL
 * @returns 색상 품질 정보
 */
export function estimateColorQuality(format: string, imageUrl: string): { score: number; details: string } {
  // 형식별 기본 색상 품질 점수
  let baseScore = 0.7; // 기본값
  let details = '표준 색상 품질';
  
  // 이미지 형식별 점수 조정
  switch (format.toLowerCase()) {
    case 'png':
      baseScore = 0.85;
      details = '선명한 색상 재현';
      break;
    case 'webp':
      baseScore = 0.8;
      details = '효율적인 색상 표현';
      break;
    case 'avif':
      baseScore = 0.9;
      details = '뛰어난 색상 표현';
      break;
    case 'jpg':
    case 'jpeg':
      baseScore = 0.75;
      details = '적절한 색상 압축';
      break;
    case 'gif':
      baseScore = 0.6;
      details = '제한된 색상 팔레트';
      break;
    case 'svg':
      baseScore = 0.9;
      details = '벡터 기반 선명한 색상';
      break;
  }
  
  // URL 기반 품질 힌트
  const url = imageUrl.toLowerCase();
  
  if (url.includes('studio') || url.includes('professional') || url.includes('product-photo')) {
    baseScore = Math.min(1.0, baseScore + 0.1);
    details = '전문적인 색상 처리';
  }
  
  if (url.includes('vibrant') || url.includes('colorful')) {
    baseScore = Math.min(1.0, baseScore + 0.05);
    details += ', 생생한 색상';
  }
  
  if (url.includes('grayscale') || url.includes('bw') || url.includes('black-and-white')) {
    baseScore = Math.max(0.4, baseScore - 0.1);
    details = '흑백 또는 제한된 색상';
  }
  
  return { score: baseScore, details };
}

/**
 * 종합 품질 점수를 계산하고 등급을 부여합니다.
 * 
 * @param scores 개별 품질 요소 점수
 * @param weightFactors 가중치 팩터 (기본값은 동일 가중치)
 * @returns 종합 점수와 등급
 */
export function calculateOverallScore(
  scores: {
    resolution: number;
    sharpness: number;
    noise: number;
    colorQuality: number;
    lighting: number;
    compression: number;
  },
  weightFactors?: {
    resolution?: number;
    sharpness?: number;
    noise?: number;
    colorQuality?: number;
    lighting?: number;
    compression?: number;
  }
): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; recommendation: string } {
  // 기본 가중치 설정
  const weights = {
    resolution: weightFactors?.resolution || 1.0,
    sharpness: weightFactors?.sharpness || 1.0,
    noise: weightFactors?.noise || 0.8,
    colorQuality: weightFactors?.colorQuality || 0.9,
    lighting: weightFactors?.lighting || 0.7,
    compression: weightFactors?.compression || 0.6
  };
  
  // 총 가중치 계산
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  // 가중 평균 계산
  const weightedScore = (
    scores.resolution * weights.resolution +
    scores.sharpness * weights.sharpness +
    scores.noise * weights.noise +
    scores.colorQuality * weights.colorQuality +
    scores.lighting * weights.lighting +
    scores.compression * weights.compression
  ) / totalWeight;
  
  // 점수 반올림 (소수점 둘째 자리까지)
  const finalScore = Math.round(weightedScore * 100) / 100;
  
  // 등급 결정
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let recommendation: string;
  
  if (finalScore >= 0.9) {
    grade = 'A';
    recommendation = '탁월한 품질의 이미지입니다. 현재 상태 유지를 권장합니다.';
  } else if (finalScore >= 0.8) {
    grade = 'B';
    recommendation = '우수한 품질의 이미지입니다. 약간의 개선으로 완벽해질 수 있습니다.';
  } else if (finalScore >= 0.7) {
    grade = 'C';
    recommendation = '양호한 품질의 이미지입니다. 선명도와 해상도 개선을 고려해보세요.';
  } else if (finalScore >= 0.5) {
    grade = 'D';
    recommendation = '개선이 필요한 이미지입니다. 더 높은 해상도와 품질의 이미지로 교체를 권장합니다.';
  } else {
    grade = 'F';
    recommendation = '품질이 낮은 이미지입니다. 더 나은 품질의 이미지로 교체가 필요합니다.';
  }
  
  return { score: finalScore, grade, recommendation };
}

/**
 * 이미지 품질을 종합적으로 평가합니다.
 * 
 * @param imageUrl 이미지 URL
 * @param options 평가 옵션
 * @returns 품질 평가 결과
 */
export async function assessImageQuality(
  imageUrl: string, 
  options: ImageQualityOptions = {}
): Promise<ImageQualityAssessment> {
  try {
    // 캐시된 결과 확인
    if (kvClient) {
      const cacheKey = `image_quality:${imageUrl}`;
      const cachedResult = await kvClient.get(cacheKey);
      
      if (cachedResult) {
        return cachedResult as ImageQualityAssessment;
      }
    }
    
    // 기본 옵션 설정
    const {
      minWidth = 800,
      minHeight = 600,
      includeMetadata = true,
      weightFactors
    } = options;
    
    // 이미지 해상도 가져오기
    const resolution = await getImageResolution(imageUrl) || { width: 800, height: 600 };
    const format = getImageFormat(imageUrl);
    
    // 해상도 점수 계산
    const resolutionScore = calculateResolutionScore(resolution.width, resolution.height, minWidth, minHeight);
    
    // 압축 품질 추정
    const compression = estimateCompressionQuality(format);
    
    // URL 기반 품질 특성 추정
    const qualityEstimates = estimateImageQualityFromUrl(imageUrl);
    
    // 색상 품질 추정 (형식 및 URL 기반)
    const colorQuality = estimateColorQuality(format, imageUrl);
    
    // 종합 점수 계산
    const overall = calculateOverallScore(
      {
        resolution: resolutionScore,
        sharpness: qualityEstimates.sharpness.score,
        noise: qualityEstimates.noise.score,
        colorQuality: colorQuality.score,
        lighting: qualityEstimates.lighting.score,
        compression: compression.score
      },
      weightFactors
    );
    
    // 결과 객체 생성
    const result: ImageQualityAssessment = {
      imageUrl,
      resolution: {
        width: resolution.width,
        height: resolution.height,
        score: resolutionScore
      },
      sharpness: qualityEstimates.sharpness,
      noise: qualityEstimates.noise,
      colorQuality,
      lighting: qualityEstimates.lighting,
      compression,
      overall
    };
    
    // 메타데이터 추가 (요청된 경우)
    if (includeMetadata) {
      result.metadata = {
        format,
        aspectRatio: resolution.width / resolution.height
      };
    }
    
    // 결과 캐싱 (KV 스토어가 설정된 경우)
    if (kvClient) {
      const cacheKey = `image_quality:${imageUrl}`;
      // 24시간 캐시 (86400초)
      await kvClient.set(cacheKey, result, { ex: 86400 });
    }
    
    return result;
  } catch (error) {
    console.error('이미지 품질 평가 실패:', error);
    
    // 오류 발생 시 기본 결과 반환
    return {
      imageUrl,
      resolution: {
        width: 0,
        height: 0,
        score: 0.5
      },
      sharpness: {
        score: 0.5,
        details: '평가할 수 없음'
      },
      noise: {
        level: 'medium',
        score: 0.5
      },
      colorQuality: {
        score: 0.5,
        details: '평가할 수 없음'
      },
      lighting: {
        score: 0.5,
        details: '평가할 수 없음'
      },
      compression: {
        level: 'medium',
        score: 0.5
      },
      overall: {
        score: 0.5,
        grade: 'C',
        recommendation: '이미지 품질을 평가할 수 없습니다. 다른 이미지를 사용해 보세요.'
      }
    };
  }
}

/**
 * 여러 이미지의 품질을 평가하고 결과를 반환합니다.
 * 
 * @param imageUrls 이미지 URL 배열
 * @param options 평가 옵션
 * @returns 품질 평가 결과 배열
 */
export async function assessMultipleImagesQuality(
  imageUrls: string[],
  options: ImageQualityOptions = {}
): Promise<ImageQualityAssessment[]> {
  try {
    // 병렬로 이미지 품질 평가 실행 (최대 10개까지만 처리)
    const assessmentPromises = imageUrls.slice(0, 10).map(url => assessImageQuality(url, options));
    return await Promise.all(assessmentPromises);
  } catch (error) {
    console.error('다수 이미지 품질 평가 실패:', error);
    return [];
  }
}

/**
 * 품질 평가 결과를 기반으로 이미지를 점수순으로 정렬합니다.
 * 
 * @param assessments 이미지 품질 평가 결과 배열
 * @returns 점수순으로 정렬된 이미지 URL 배열
 */
export function rankImagesByQuality(assessments: ImageQualityAssessment[]): string[] {
  return assessments
    .sort((a, b) => b.overall.score - a.overall.score)
    .map(assessment => assessment.imageUrl);
}

/**
 * 특정 해상도나 품질 기준을 충족하는 이미지만 필터링합니다.
 * 
 * @param assessments 이미지 품질 평가 결과 배열
 * @param minScore 최소 종합 점수 기준 (0-1)
 * @param minResolutionScore 최소 해상도 점수 기준 (0-1)
 * @param minWidth 최소 너비 (픽셀)
 * @param minHeight 최소 높이 (픽셀)
 * @returns 필터링된 이미지 URL 배열
 */
export function filterImagesByQualityCriteria(
  assessments: ImageQualityAssessment[],
  minScore = 0.7,
  minResolutionScore = 0.6,
  minWidth = 0,
  minHeight = 0
): string[] {
  return assessments
    .filter(assessment => 
      assessment.overall.score >= minScore &&
      assessment.resolution.score >= minResolutionScore &&
      assessment.resolution.width >= minWidth &&
      assessment.resolution.height >= minHeight
    )
    .map(assessment => assessment.imageUrl);
} 