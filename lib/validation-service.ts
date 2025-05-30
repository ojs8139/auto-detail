"use client";

import { RegenerationResult, RegenerationOptions } from "./regeneration-service";

/**
 * 검증 결과 인터페이스
 */
export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
}

/**
 * 검증 이슈 인터페이스
 */
export interface ValidationIssue {
  type: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  position?: {
    start?: number;
    end?: number;
  };
}

/**
 * 검증 설정 인터페이스
 */
export interface ValidationConfig {
  thresholds: {
    contextConsistency: number;
    styleConsistency: number;
    formatConsistency: number;
    keywordRetention: number;
    overallConsistency: number;
  };
  weights: {
    contextConsistency: number;
    styleConsistency: number;
    formatConsistency: number;
    keywordRetention: number;
  };
}

/**
 * 기본 검증 설정
 */
const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  thresholds: {
    contextConsistency: 0.7,
    styleConsistency: 0.7,
    formatConsistency: 0.8,
    keywordRetention: 0.75,
    overallConsistency: 0.75
  },
  weights: {
    contextConsistency: 0.4,
    styleConsistency: 0.3,
    formatConsistency: 0.2,
    keywordRetention: 0.1
  }
};

/**
 * 컨텍스트 일관성 검증 서비스
 */
export class ValidationService {
  private config: ValidationConfig;
  
  /**
   * 생성자
   * @param config 검증 설정 (선택적)
   */
  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      ...DEFAULT_VALIDATION_CONFIG,
      ...config,
      thresholds: {
        ...DEFAULT_VALIDATION_CONFIG.thresholds,
        ...(config?.thresholds || {})
      },
      weights: {
        ...DEFAULT_VALIDATION_CONFIG.weights,
        ...(config?.weights || {})
      }
    };
  }
  
  /**
   * 재생성 결과 검증
   * @param result 재생성 결과
   * @returns 검증 결과
   */
  public validateRegenerationResult(result: RegenerationResult): ValidationResult {
    // 텍스트와 이미지 검증 분리
    if (typeof result.originalContent === 'string' && typeof result.newContent === 'string') {
      return this.validateTextRegeneration(result);
    } else {
      return this.validateImageRegeneration(result);
    }
  }
  
  /**
   * 텍스트 재생성 검증
   * @param result 재생성 결과
   * @returns 검증 결과
   */
  private validateTextRegeneration(result: RegenerationResult): ValidationResult {
    const options = result.options;
    const originalContent = result.originalContent as string;
    const newContent = result.newContent as string;
    
    // 검증 점수 초기화
    const scores = {
      contextConsistency: 0,
      styleConsistency: 0,
      formatConsistency: 0,
      keywordRetention: 0
    };
    
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    
    // 1. 컨텍스트 일관성 검증
    scores.contextConsistency = this.calculateContextConsistency(originalContent, newContent);
    if (scores.contextConsistency < this.config.thresholds.contextConsistency) {
      issues.push({
        type: 'context',
        severity: 'warning',
        message: '원본과 재생성된 텍스트 간의 컨텍스트 일관성이 낮습니다.'
      });
      suggestions.push('컨텍스트 일관성 향상을 위해 주요 주제와 개념을 유지하도록 설정을 조정하세요.');
    }
    
    // 2. 스타일 일관성 검증
    scores.styleConsistency = this.calculateStyleConsistency(originalContent, newContent, options);
    if (scores.styleConsistency < this.config.thresholds.styleConsistency) {
      issues.push({
        type: 'style',
        severity: 'warning',
        message: '원본과 재생성된 텍스트 간의 스타일 일관성이 낮습니다.'
      });
      suggestions.push('스타일 일관성 향상을 위해 문체, 어조, 형식을 일치시키도록 설정을 조정하세요.');
    }
    
    // 3. 형식 일관성 검증 (옵션에서 preserveFormat이 true인 경우)
    if (options.preserveFormat) {
      scores.formatConsistency = this.calculateFormatConsistency(originalContent, newContent);
      if (scores.formatConsistency < this.config.thresholds.formatConsistency) {
        issues.push({
          type: 'format',
          severity: 'error',
          message: '형식 유지 옵션이 활성화되었지만 형식이 일치하지 않습니다.'
        });
        suggestions.push('재생성 시 문단 구조, 줄바꿈, 서식 등의 형식 요소를 유지하도록 하세요.');
      }
    } else {
      scores.formatConsistency = 1.0; // 형식 유지가 요구되지 않는 경우 만점 처리
    }
    
    // 4. 키워드 유지 검증 (옵션에서 preserveKeywords가 true인 경우)
    if (options.preserveKeywords) {
      scores.keywordRetention = this.calculateKeywordRetention(originalContent, newContent);
      if (scores.keywordRetention < this.config.thresholds.keywordRetention) {
        issues.push({
          type: 'keywords',
          severity: 'error',
          message: '키워드 유지 옵션이 활성화되었지만 주요 키워드가 유지되지 않았습니다.'
        });
        suggestions.push('재생성 시 원본 텍스트의 주요 키워드와 용어를 보존하도록 하세요.');
      }
    } else {
      scores.keywordRetention = 1.0; // 키워드 유지가 요구되지 않는 경우 만점 처리
    }
    
    // 전체 점수 계산 (가중치 적용)
    const overallScore = 
      scores.contextConsistency * this.config.weights.contextConsistency +
      scores.styleConsistency * this.config.weights.styleConsistency +
      scores.formatConsistency * this.config.weights.formatConsistency +
      scores.keywordRetention * this.config.weights.keywordRetention;
    
    const isValid = overallScore >= this.config.thresholds.overallConsistency;
    
    // 결과 반환
    return {
      isValid,
      score: overallScore,
      issues,
      suggestions
    };
  }
  
  /**
   * 이미지 재생성 검증
   * @param result 재생성 결과
   * @returns 검증 결과
   */
  private validateImageRegeneration(result: RegenerationResult): ValidationResult {
    // 이미지는 주로 메타데이터 기반 검증만 가능하므로 간단히 처리
    // 실제 이미지 픽셀 분석은 복잡하므로 여기서는 제외
    
    const options = result.options;
    const issues: ValidationIssue[] = [];
    const suggestions: string[] = [];
    
    // 옵션 기반 검증 (이미지 특성을 보존하도록 설정된 경우)
    if (options.preserveComposition && Math.random() < 0.2) { // 임의 검증을 위한 예시
      issues.push({
        type: 'composition',
        severity: 'warning',
        message: '이미지 구도 유지 옵션이 활성화되었지만 구도가 크게 변경되었습니다.'
      });
      suggestions.push('이미지 재생성 시 원본 이미지의 주요 구도와 레이아웃을 유지하도록 하세요.');
    }
    
    if (options.preserveColorPalette && Math.random() < 0.2) {
      issues.push({
        type: 'colors',
        severity: 'warning',
        message: '색상 팔레트 유지 옵션이 활성화되었지만 색상 구성이 크게 변경되었습니다.'
      });
      suggestions.push('이미지 재생성 시 원본 이미지의 주요 색상 팔레트를 유지하도록 하세요.');
    }
    
    // 이미지 변형 관련 검증
    if (options.transformations) {
      // 변형 옵션이 적용된 경우 검증 (필요 시 추가)
    }
    
    // 간소화된 점수 계산 (실제로는 더 정교한 이미지 분석 필요)
    const score = issues.length > 0 ? 0.7 : 0.95;
    const isValid = score >= this.config.thresholds.overallConsistency;
    
    return {
      isValid,
      score,
      issues,
      suggestions
    };
  }
  
  /**
   * 컨텍스트 일관성 점수 계산
   * @param originalText 원본 텍스트
   * @param newText 새 텍스트
   * @returns 일관성 점수 (0-1)
   */
  private calculateContextConsistency(originalText: string, newText: string): number {
    // 실제 구현에서는 NLP 기반 의미 분석이 필요
    // 여기서는 간단한 단어 빈도 분석으로 대체
    
    const originalWords = this.getSignificantWords(originalText);
    const newWords = this.getSignificantWords(newText);
    
    // 교집합 크기 계산
    const intersection = originalWords.filter(word => newWords.includes(word));
    
    // 자카드 유사도 계산
    const union = Array.from(new Set([...originalWords, ...newWords]));
    const similarity = intersection.length / union.length;
    
    return similarity;
  }
  
  /**
   * 스타일 일관성 점수 계산
   * @param originalText 원본 텍스트
   * @param newText 새 텍스트
   * @param options 재생성 옵션
   * @returns 일관성 점수 (0-1)
   */
  private calculateStyleConsistency(originalText: string, newText: string, options: RegenerationOptions): number {
    // 스타일 옵션이 명시적으로 변경되었다면 스타일 일관성은 중요하지 않음
    if (options.style && options.style !== 'default') {
      return 1.0;
    }
    
    // 간단한 스타일 지표:
    // 1. 문장 길이 분포
    // 2. 단어 길이 분포
    // 3. 구두점 사용 패턴
    
    const originalStats = this.calculateTextStats(originalText);
    const newStats = this.calculateTextStats(newText);
    
    // 문장 길이 유사도
    const sentenceLengthDiff = Math.abs(originalStats.avgSentenceLength - newStats.avgSentenceLength);
    const sentenceLengthSimilarity = 1 - Math.min(sentenceLengthDiff / originalStats.avgSentenceLength, 1);
    
    // 단어 길이 유사도
    const wordLengthDiff = Math.abs(originalStats.avgWordLength - newStats.avgWordLength);
    const wordLengthSimilarity = 1 - Math.min(wordLengthDiff / originalStats.avgWordLength, 1);
    
    // 구두점 비율 유사도
    const punctuationDiff = Math.abs(originalStats.punctuationRatio - newStats.punctuationRatio);
    const punctuationSimilarity = 1 - Math.min(punctuationDiff / Math.max(0.01, originalStats.punctuationRatio), 1);
    
    // 평균 스타일 유사도
    return (sentenceLengthSimilarity + wordLengthSimilarity + punctuationSimilarity) / 3;
  }
  
  /**
   * 형식 일관성 점수 계산
   * @param originalText 원본 텍스트
   * @param newText 새 텍스트
   * @returns 일관성 점수 (0-1)
   */
  private calculateFormatConsistency(originalText: string, newText: string): number {
    // 형식 요소:
    // 1. 단락 수
    // 2. 줄바꿈 패턴
    // 3. 목록 스타일
    
    const originalParas = originalText.split(/\n\s*\n/);
    const newParas = newText.split(/\n\s*\n/);
    
    // 단락 수 유사도
    const paraDiff = Math.abs(originalParas.length - newParas.length);
    const paraSimilarity = 1 - Math.min(paraDiff / originalParas.length, 1);
    
    // 줄바꿈 패턴 유사도
    const originalLineBreaks = (originalText.match(/\n/g) || []).length;
    const newLineBreaks = (newText.match(/\n/g) || []).length;
    const lineBreakDiff = Math.abs(originalLineBreaks - newLineBreaks);
    const lineBreakSimilarity = 1 - Math.min(lineBreakDiff / Math.max(1, originalLineBreaks), 1);
    
    // 목록 아이템 수 유사도
    const originalListItems = (originalText.match(/^[•\-*]\s+/gm) || []).length;
    const newListItems = (newText.match(/^[•\-*]\s+/gm) || []).length;
    const listItemDiff = Math.abs(originalListItems - newListItems);
    const listItemSimilarity = originalListItems === 0 ? 
      (newListItems === 0 ? 1 : 0) : 
      (1 - Math.min(listItemDiff / originalListItems, 1));
    
    // 평균 형식 유사도
    return (paraSimilarity + lineBreakSimilarity + listItemSimilarity) / 3;
  }
  
  /**
   * 키워드 유지 점수 계산
   * @param originalText 원본 텍스트
   * @param newText 새 텍스트
   * @returns 키워드 유지 점수 (0-1)
   */
  private calculateKeywordRetention(originalText: string, newText: string): number {
    // 키워드 추출 (TF-IDF와 같은 고급 기법 대신 간단한 접근법 사용)
    const originalKeywords = this.extractKeywords(originalText);
    const newText_lower = newText.toLowerCase();
    
    // 각 키워드가 새 텍스트에 포함되는지 확인
    let retainedCount = 0;
    for (const keyword of originalKeywords) {
      if (newText_lower.includes(keyword.toLowerCase())) {
        retainedCount++;
      }
    }
    
    // 유지된 키워드 비율 계산
    return originalKeywords.length > 0 ? retainedCount / originalKeywords.length : 1;
  }
  
  /**
   * 주요 단어 추출
   * @param text 텍스트
   * @returns 주요 단어 배열
   */
  private getSignificantWords(text: string): string[] {
    // 불용어(stopwords) 정의
    const stopwords = [
      '이', '그', '저', '것', '는', '을', '를', '이', '가', '은', '는', '와', '과', '으로', '로', '에', '에서',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like',
      'through', 'over', 'before', 'after', 'since', 'of', 'from'
    ];
    
    // 단어 추출 및 불용어 제거
    const words = text.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopwords.includes(word));
    
    return words;
  }
  
  /**
   * 키워드 추출
   * @param text 텍스트
   * @param count 추출할 키워드 수 (기본값: 10)
   * @returns 키워드 배열
   */
  private extractKeywords(text: string, count: number = 10): string[] {
    // 불용어 제거 및 단어 빈도 계산
    const words = this.getSignificantWords(text);
    const wordFrequency: Record<string, number> = {};
    
    for (const word of words) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
    
    // 빈도수에 따라 정렬하고 상위 n개 반환
    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(entry => entry[0]);
  }
  
  /**
   * 텍스트 통계 계산
   * @param text 텍스트
   * @returns 텍스트 통계
   */
  private calculateTextStats(text: string): {
    avgSentenceLength: number;
    avgWordLength: number;
    punctuationRatio: number;
  } {
    // 문장 분리
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // 단어 분리
    const words = text.split(/\s+/).filter(w => w.length > 0);
    
    // 구두점 수
    const punctuationCount = (text.match(/[.,!?;:]/g) || []).length;
    
    // 평균 문장 길이 (단어 수 기준)
    const avgSentenceLength = sentences.length > 0 ? 
      words.length / sentences.length : 0;
    
    // 평균 단어 길이
    const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
    const avgWordLength = words.length > 0 ? 
      totalWordLength / words.length : 0;
    
    // 구두점 비율
    const punctuationRatio = text.length > 0 ? 
      punctuationCount / text.length : 0;
    
    return {
      avgSentenceLength,
      avgWordLength,
      punctuationRatio
    };
  }
} 