"use client";

import { RegenerationResult, RegenerationOptions } from "./regeneration-service";
import { ValidationService, ValidationResult, ValidationIssue } from "./validation-service";

/**
 * 일관성 검증 결과 인터페이스
 */
export interface ConsistencyValidationResult {
  result: RegenerationResult;
  validation: ValidationResult;
  timestamp: number;
}

/**
 * 일관성 검증 이벤트 리스너 타입
 */
export type ConsistencyValidationListener = (result: ConsistencyValidationResult) => void;

/**
 * 일관성 검증 설정 인터페이스
 */
export interface ConsistencyValidatorConfig {
  autoValidate: boolean;
  strictMode: boolean;
  validationThreshold: number;
}

/**
 * 기본 일관성 검증 설정
 */
const DEFAULT_CONFIG: ConsistencyValidatorConfig = {
  autoValidate: true,
  strictMode: false,
  validationThreshold: 0.75
};

/**
 * 일관성 검증기 클래스
 */
export class ConsistencyValidator {
  private validationService: ValidationService;
  private config: ConsistencyValidatorConfig;
  private validationResults: Map<string, ConsistencyValidationResult> = new Map();
  private listeners: Set<ConsistencyValidationListener> = new Set();
  
  /**
   * 생성자
   * @param config 검증 설정 (선택적)
   */
  constructor(config?: Partial<ConsistencyValidatorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validationService = new ValidationService();
  }
  
  /**
   * 재생성 결과 검증
   * @param result 재생성 결과
   * @returns 검증 결과
   */
  public validate(result: RegenerationResult): ConsistencyValidationResult {
    // 검증 실행
    const validation = this.validationService.validateRegenerationResult(result);
    
    // 검증 결과 저장
    const validationResult: ConsistencyValidationResult = {
      result,
      validation,
      timestamp: Date.now()
    };
    
    this.validationResults.set(result.id, validationResult);
    
    // 리스너에게 알림
    this.notifyListeners(validationResult);
    
    return validationResult;
  }
  
  /**
   * 검증 결과 확인
   * @param resultId 재생성 결과 ID
   * @returns 검증 결과 또는 undefined
   */
  public getValidationResult(resultId: string): ConsistencyValidationResult | undefined {
    return this.validationResults.get(resultId);
  }
  
  /**
   * 검증 결과가 유효한지 확인
   * @param result 재생성 결과
   * @returns 유효 여부
   */
  public isValid(result: RegenerationResult): boolean {
    const validationResult = this.validationResults.get(result.id);
    
    if (!validationResult) {
      // 아직 검증되지 않은 결과는 즉시 검증
      return this.validate(result).validation.isValid;
    }
    
    return validationResult.validation.isValid;
  }
  
  /**
   * 심각한 이슈가 있는지 확인
   * @param result 재생성 결과
   * @returns 심각한 이슈 여부
   */
  public hasCriticalIssues(result: RegenerationResult): boolean {
    const validationResult = this.validationResults.get(result.id) || this.validate(result);
    return validationResult.validation.issues.some(issue => issue.severity === 'error');
  }
  
  /**
   * 검증 이벤트 리스너 등록
   * @param listener 리스너 함수
   * @returns 리스너 제거 함수
   */
  public addListener(listener: ConsistencyValidationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * 리스너에게 검증 결과 알림
   * @param result 검증 결과
   */
  private notifyListeners(result: ConsistencyValidationResult): void {
    this.listeners.forEach(listener => listener(result));
  }
  
  /**
   * 설정 업데이트
   * @param config 새 설정
   */
  public updateConfig(config: Partial<ConsistencyValidatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * 검증 결과 초기화
   */
  public clearResults(): void {
    this.validationResults.clear();
  }
  
  /**
   * 특정 결과의 검증 결과 제거
   * @param resultId 재생성 결과 ID
   */
  public removeValidationResult(resultId: string): void {
    this.validationResults.delete(resultId);
  }
  
  /**
   * 검증 요약 생성
   * @param result 재생성 결과
   * @returns 검증 요약 문자열
   */
  public getSummary(result: RegenerationResult): string {
    const validationResult = this.validationResults.get(result.id) || this.validate(result);
    const { isValid, score, issues } = validationResult.validation;
    
    if (isValid && issues.length === 0) {
      return '컨텍스트 일관성 검증을 통과했습니다.';
    }
    
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    if (errorCount > 0) {
      return `컨텍스트 일관성 검증 실패: ${errorCount}개의 오류와 ${warningCount}개의 경고가 있습니다.`;
    }
    
    if (warningCount > 0) {
      return `컨텍스트 일관성 검증 경고: ${warningCount}개의 경고가 있습니다.`;
    }
    
    return `컨텍스트 일관성 점수: ${Math.round(score * 100)}%`;
  }
} 