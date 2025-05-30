/**
 * 요소 재생성 서비스
 * 텍스트 및 이미지 요소의 재생성 기능을 제공합니다.
 */

import { nanoid } from 'nanoid';

// 스타일 유형 정의
export type TextStyleType = 'informative' | 'persuasive' | 'emotional' | 'technical' | 'narrative' | 'default';
export type ImageStyleType = 'photo' | 'illustration' | 'graphic' | 'minimalist' | 'default';

// 재생성 옵션 인터페이스
export interface RegenerationOptions {
  style?: TextStyleType | ImageStyleType;
  preserveFormat?: boolean;
  preserveLength?: boolean;
  preserveKeywords?: boolean;
  preserveContext?: boolean;
  
  // 고급 옵션
  styleIntensity?: number; // 스타일 적용 강도 (0-1)
  quality?: 'draft' | 'standard' | 'high'; // 생성 품질
  
  // 텍스트 고급 옵션
  toneConsistency?: boolean; // 어조 일관성 유지
  enhanceClarity?: boolean; // 명확성 향상
  preserveParagraphs?: boolean; // 단락 구조 유지
  preserveSentenceStructure?: boolean; // 문장 구조 유지
  
  // 이미지 고급 옵션
  preserveComposition?: boolean; // 구도 유지
  preserveFocalPoint?: boolean; // 주요 초점 유지
  preserveColorPalette?: boolean; // 색상 팔레트 유지
  preserveMood?: boolean; // 전체적인 분위기 유지
  
  // 내부 사용 플래그
  isRollback?: boolean;
  isUndo?: boolean;
  transformations?: any;
  cropArea?: any;
}

// 재생성 결과 인터페이스
export interface RegenerationResult {
  id: string;
  originalContent: string;
  newContent: string;
  timestamp: number;
  options: RegenerationOptions;
}

// 기록 저장소
interface HistoryStore {
  [elementId: string]: RegenerationResult[];
}

/**
 * 텍스트에서 키워드 추출
 * @param text 원본 텍스트
 * @returns 추출된 키워드 배열
 */
function extractKeywords(text: string): string[] {
  // 간단한 키워드 추출 로직 (실제 프로덕션에서는 NLP 라이브러리 사용 권장)
  // 1. 텍스트를 단어로 분리
  const words = text.split(/\s+/);
  
  // 2. 불용어 필터링 (짧은 단어, 일반적인 단어 등)
  const stopWords = ['그', '이', '저', '것', '수', '등', '및', '을', '를', '이', '가', '은', '는', '에', '에서', '로', '으로', '와', '과', '의', '에게', '보다', '다', '한', '하다', '했다', '된다', '일', '더', '또', '못', '안', '못하다', '안하다'];
  const filteredWords = words.filter(word => 
    word.length > 1 && !stopWords.includes(word.toLowerCase())
  );
  
  // 3. 중복 제거 및 빈도수 기준 정렬
  const wordCounts: Record<string, number> = {};
  filteredWords.forEach(word => {
    const normalized = word.toLowerCase().replace(/[.,!?;:'"()]/g, '');
    if (normalized) {
      wordCounts[normalized] = (wordCounts[normalized] || 0) + 1;
    }
  });
  
  // 4. 빈도수 기준으로 정렬하여 상위 키워드 반환
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
}

/**
 * 텍스트 서식 추출
 * @param text 원본 텍스트
 * @returns 서식 정보
 */
function extractTextFormat(text: string): { 
  hasPunctuation: boolean;
  sentenceCount: number;
  avgSentenceLength: number;
  hasQuestions: boolean;
  hasExclamations: boolean;
  hasListItems: boolean;
} {
  // 문장 분리
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  return {
    hasPunctuation: /[.,!?;:]/.test(text),
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 
      ? sentences.reduce((sum, s) => sum + s.trim().length, 0) / sentences.length
      : 0,
    hasQuestions: text.includes('?'),
    hasExclamations: text.includes('!'),
    hasListItems: /(\d+\.\s|\-\s|\*\s)/.test(text)
  };
}

/**
 * 텍스트 스타일 변환
 * @param text 원본 텍스트
 * @param style 적용할 스타일
 * @returns 변환된 텍스트
 */
function applyTextStyle(text: string, style: TextStyleType): string {
  switch (style) {
    case 'informative':
      // 정보 제공형 스타일: 명확하고 직접적인 언어, 사실 기반
      return text.replace(/(?:\s|^)([가-힣a-zA-Z0-9]+)(?=\s|$)/g, (match) => {
        // 일부 단어를 더 명확한 표현으로 대체 (예시)
        if (Math.random() > 0.7) {
          return ` 명확한${match}`;
        }
        return match;
      });
      
    case 'persuasive':
      // 설득형 스타일: 강한 어조, 행동 유도 표현
      return text.replace(/(?:\s|^)([가-힣a-zA-Z0-9]+)(?=\s|$)/g, (match) => {
        // 일부 단어에 강조 추가 (예시)
        if (Math.random() > 0.7) {
          return ` 반드시${match}`;
        }
        return match;
      });
      
    case 'emotional':
      // 감성적 스타일: 감정적 어휘, 형용사 활용
      return text.replace(/(?:\s|^)([가-힣a-zA-Z0-9]+)(?=\s|$)/g, (match) => {
        // 일부 단어에 감성적 표현 추가 (예시)
        if (Math.random() > 0.7) {
          return ` 감동적인${match}`;
        }
        return match;
      });
      
    case 'technical':
      // 기술적 스타일: 전문 용어, 정확한 설명
      return text.replace(/(?:\s|^)([가-힣a-zA-Z0-9]+)(?=\s|$)/g, (match) => {
        // 일부 단어를 기술적 표현으로 변경 (예시)
        if (Math.random() > 0.7) {
          return ` 기술적${match}`;
        }
        return match;
      });
      
    case 'narrative':
      // 이야기형 스타일: 스토리텔링 요소, 개인화된 어조
      return text.replace(/(?:\s|^)([가-힣a-zA-Z0-9]+)(?=\s|$)/g, (match) => {
        // 일부 단어를 내러티브 표현으로 변경 (예시)
        if (Math.random() > 0.7) {
          return ` 흥미로운${match}`;
        }
        return match;
      });
      
    default:
      return text;
  }
}

/**
 * 스타일에 따른 이미지 URL 생성
 * @param style 적용할 스타일
 * @param seed 랜덤 시드(이미지 다양성 위함)
 * @returns 이미지 URL
 */
function generateImageUrlByStyle(style: ImageStyleType, seed: number = Math.floor(Math.random() * 1000)): string {
  // 실제 API 호출 대신 샘플 이미지 URL 생성
  const colors: Record<ImageStyleType, string> = {
    'photo': '2a86db/ffffff',
    'illustration': '9c27b0/ffffff',
    'graphic': 'e91e63/ffffff',
    'minimalist': '009688/ffffff',
    'default': '607d8b/ffffff'
  };
  
  const labels: Record<ImageStyleType, string> = {
    'photo': 'Photo+Style',
    'illustration': 'Illustration+Style',
    'graphic': 'Graphic+Style',
    'minimalist': 'Minimalist+Style',
    'default': 'Default+Style'
  };
  
  const color = colors[style] || colors.default;
  const label = labels[style] || labels.default;
  
  return `https://placehold.co/600x400/${color}?text=${label}&random=${seed}`;
}

/**
 * 재생성 서비스 클래스
 */
export class RegenerationService {
  private historyStore: HistoryStore = {};
  
  /**
   * 텍스트 재생성
   * @param elementId 요소 ID
   * @param originalText 원본 텍스트
   * @param options 재생성 옵션
   * @returns 재생성 결과
   */
  async regenerateText(
    elementId: string, 
    originalText: string, 
    options: RegenerationOptions = {}
  ): Promise<RegenerationResult> {
    // 실제 프로덕션에서는 API 호출 등으로 대체
    console.log(`텍스트 재생성 요청: ${elementId}`, options);
    
    // 키워드 추출 (preserveKeywords 옵션이 true인 경우)
    const keywords = options.preserveKeywords ? extractKeywords(originalText) : [];
    
    // 서식 정보 추출 (preserveFormat 옵션이 true인 경우)
    const formatInfo = options.preserveFormat ? extractTextFormat(originalText) : null;
    
    // 길이 정보 (preserveLength 옵션이 true인 경우)
    const originalLength = options.preserveLength ? originalText.length : 0;
    
    // 원본 텍스트 문장 분석
    const originalSentences = originalText.split(/(?<=[.!?])\s+/);
    
    // 스타일 적용
    const style = options.style as TextStyleType || 'default';
    let newText = '';
    
    // 실제 재생성 로직 (프로덕션에서는 API 호출)
    if (options.preserveKeywords) {
      // 키워드 유지 옵션: 추출된 키워드를 포함하는 새 텍스트 생성
      newText = `[키워드 유지: ${keywords.join(', ')}] ${originalText}`;
    } else if (options.preserveFormat && formatInfo) {
      // 서식 유지 옵션: 원본 서식을 유지하는 새 텍스트 생성
      let formattedText = originalText;
      
      if (formatInfo.hasQuestions) {
        formattedText = `[질문 형식 유지] ${formattedText}`;
      }
      
      if (formatInfo.hasExclamations) {
        formattedText = `[감탄 형식 유지] ${formattedText}`;
      }
      
      if (formatInfo.hasListItems) {
        formattedText = `[목록 형식 유지] ${formattedText}`;
      }
      
      newText = formattedText;
    } else if (options.preserveLength) {
      // 길이 유지 옵션: 원본과 비슷한 길이의 새 텍스트 생성
      newText = `[원본 길이(${originalLength}자) 유지] ${originalText}`;
    } else {
      // 기본 스타일 적용
      newText = applyTextStyle(originalText, style);
    }
    
    // 결과 생성
    const result: RegenerationResult = {
      id: nanoid(),
      originalContent: originalText,
      newContent: newText,
      timestamp: Date.now(),
      options
    };
    
    // 히스토리에 저장
    if (!this.historyStore[elementId]) {
      this.historyStore[elementId] = [];
    }
    this.historyStore[elementId].push(result);
    
    return result;
  }
  
  /**
   * 이미지 재생성
   * @param elementId 요소 ID
   * @param originalImageUrl 원본 이미지 URL
   * @param options 재생성 옵션
   * @returns 재생성 결과
   */
  async regenerateImage(
    elementId: string, 
    originalImageUrl: string, 
    options: RegenerationOptions = {}
  ): Promise<RegenerationResult> {
    // 실제 프로덕션에서는 API 호출 등으로 대체
    console.log(`이미지 재생성 요청: ${elementId}`, options);
    
    // 스타일에 따른 샘플 이미지 URL 생성
    const style = options.style as ImageStyleType || 'default';
    
    // 컨텍스트 유지 옵션 처리
    let placeholderUrl = '';
    if (options.preserveContext) {
      // 컨텍스트 유지 옵션이 활성화되면 원본 이미지의 특성을 보존하는 API 호출을 할 것임
      // 예를 들어 원본 이미지의 색상 팔레트, 주요 객체 위치 등을 분석하여 유지
      placeholderUrl = generateImageUrlByStyle(style, Date.now());
      placeholderUrl = placeholderUrl.replace('text=', 'text=Context+Preserved+');
    } else {
      // 일반 스타일 변환 (완전히 새로운 이미지)
      placeholderUrl = generateImageUrlByStyle(style, Date.now());
    }
    
    // 결과 생성
    const result: RegenerationResult = {
      id: nanoid(),
      originalContent: originalImageUrl,
      newContent: placeholderUrl,
      timestamp: Date.now(),
      options
    };
    
    // 히스토리에 저장
    if (!this.historyStore[elementId]) {
      this.historyStore[elementId] = [];
    }
    this.historyStore[elementId].push(result);
    
    return result;
  }
  
  /**
   * 요소의 재생성 히스토리 조회
   * @param elementId 요소 ID
   * @returns 재생성 결과 배열
   */
  getHistory(elementId: string): RegenerationResult[] {
    return this.historyStore[elementId] || [];
  }
  
  /**
   * 재생성 결과 롤백
   * @param elementId 요소 ID
   * @param resultId 결과 ID
   * @returns 롤백된 결과
   */
  rollbackToVersion(elementId: string, resultId: string): RegenerationResult | null {
    const history = this.historyStore[elementId];
    if (!history) return null;
    
    const targetResult = history.find(result => result.id === resultId);
    if (!targetResult) return null;
    
    // 롤백을 위한 새 결과 생성
    const rollbackResult: RegenerationResult = {
      id: nanoid(),
      originalContent: history[history.length - 1].newContent,
      newContent: targetResult.newContent,
      timestamp: Date.now(),
      options: { ...targetResult.options, isRollback: true } as RegenerationOptions
    };
    
    // 히스토리에 추가
    history.push(rollbackResult);
    
    return rollbackResult;
  }
  
  /**
   * 마지막 재생성 작업 실행 취소
   * @param elementId 요소 ID
   * @returns 실행 취소된 결과
   */
  undoLastRegeneration(elementId: string): RegenerationResult | null {
    const history = this.historyStore[elementId];
    if (!history || history.length <= 1) return null;
    
    // 마지막 재생성 결과 가져오기
    const lastResult = history[history.length - 1];
    const previousResult = history[history.length - 2];
    
    // 실행 취소를 위한 새 결과 생성
    const undoResult: RegenerationResult = {
      id: nanoid(),
      originalContent: lastResult.newContent,
      newContent: previousResult.newContent,
      timestamp: Date.now(),
      options: { ...previousResult.options, isUndo: true } as RegenerationOptions
    };
    
    // 히스토리에 추가
    history.push(undoResult);
    
    return undoResult;
  }
  
  /**
   * 모든 히스토리 데이터 내보내기
   * @returns 전체 히스토리 데이터
   */
  exportHistory(): HistoryStore {
    return { ...this.historyStore };
  }
  
  /**
   * 히스토리 데이터 가져오기
   * @param data 히스토리 데이터
   */
  importHistory(data: HistoryStore): void {
    this.historyStore = { ...data };
  }
  
  /**
   * 요소의 히스토리 초기화
   * @param elementId 요소 ID
   */
  clearHistory(elementId: string): void {
    if (this.historyStore[elementId]) {
      delete this.historyStore[elementId];
    }
  }
  
  /**
   * 모든 히스토리 초기화
   */
  clearAllHistory(): void {
    this.historyStore = {};
  }
  
  /**
   * 이미지 변형 (크기, 회전, 색상 등 변경)
   * @param elementId 요소 ID
   * @param originalImageUrl 원본 이미지 URL
   * @param transformations 변형 옵션
   */
  async transformImage(
    elementId: string,
    originalImageUrl: string,
    transformations: {
      rotate?: number;
      flip?: 'horizontal' | 'vertical' | 'both';
      filter?: 'grayscale' | 'sepia' | 'invert' | 'blur';
      brightness?: number; // -100 ~ 100
      contrast?: number; // -100 ~ 100
    }
  ): Promise<RegenerationResult> {
    // 실제로는 이미지 처리 API 호출 또는 캔버스를 사용한 이미지 조작 로직 필요
    console.log(`이미지 변형 요청: ${elementId}`, transformations);
    
    // 변형 정보를 URL 파라미터로 표시 (실제로는 이미지 처리 필요)
    const params = Object.entries(transformations)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    
    const placeholderUrl = `https://placehold.co/600x400/ff9800/ffffff?text=Transformed+Image&${params}`;
    
    // 결과 생성
    const result: RegenerationResult = {
      id: nanoid(),
      originalContent: originalImageUrl,
      newContent: placeholderUrl,
      timestamp: Date.now(),
      options: { transformations } as RegenerationOptions
    };
    
    // 히스토리에 저장
    if (!this.historyStore[elementId]) {
      this.historyStore[elementId] = [];
    }
    this.historyStore[elementId].push(result);
    
    return result;
  }
  
  /**
   * 이미지 확대/축소
   * @param elementId 요소 ID
   * @param originalImageUrl 원본 이미지 URL
   * @param area 확대/축소 영역 { x, y, width, height }
   */
  async cropAndResizeImage(
    elementId: string,
    originalImageUrl: string,
    area: { x: number; y: number; width: number; height: number }
  ): Promise<RegenerationResult> {
    // 실제로는 이미지 처리 API 호출 또는 캔버스를 사용한 이미지 조작 로직 필요
    console.log(`이미지 크롭/리사이즈 요청: ${elementId}`, area);
    
    // 영역 정보를 URL 파라미터로 표시 (실제로는 이미지 처리 필요)
    const params = Object.entries(area)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const placeholderUrl = `https://placehold.co/600x400/4caf50/ffffff?text=Cropped+Image&${params}`;
    
    // 결과 생성
    const result: RegenerationResult = {
      id: nanoid(),
      originalContent: originalImageUrl,
      newContent: placeholderUrl,
      timestamp: Date.now(),
      options: { cropArea: area } as RegenerationOptions
    };
    
    // 히스토리에 저장
    if (!this.historyStore[elementId]) {
      this.historyStore[elementId] = [];
    }
    this.historyStore[elementId].push(result);
    
    return result;
  }
} 