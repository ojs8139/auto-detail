"use client";

/**
 * 편집 기록 항목 인터페이스
 */
export interface HistoryItem<T = any> {
  id: string;           // 고유 ID
  timestamp: number;    // 타임스탬프
  type: string;         // 작업 유형 (예: 'image-edit', 'image-replace')
  targetId: string;     // 대상 객체 ID
  data: T;              // 작업 데이터
  description: string;  // 작업 설명
}

/**
 * 이미지 편집 작업 데이터 인터페이스
 */
export interface ImageEditData {
  previousState?: string; // 이전 이미지 상태 (데이터 URL)
  currentState?: string;  // 현재 이미지 상태 (데이터 URL)
  editType?: string;      // 편집 유형 (예: 'crop', 'filter', 'rotate')
  parameters?: any;       // 편집 매개변수
}

/**
 * 편집 기록 관리자 클래스
 */
export class HistoryManager<T = any> {
  private history: HistoryItem<T>[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number;
  private onHistoryChangeCallbacks: Set<() => void> = new Set();

  /**
   * 히스토리 관리자 생성자
   * @param maxSize 최대 기록 크기 (기본값: 20)
   */
  constructor(maxSize: number = 20) {
    this.maxHistorySize = maxSize;
  }

  /**
   * 새 작업을 기록에 추가
   * @param item 기록 항목
   */
  public addItem(item: Omit<HistoryItem<T>, 'id' | 'timestamp'>): string {
    // 현재 인덱스 이후의 기록 삭제 (실행 취소 후 새 작업을 수행한 경우)
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 고유 ID 생성
    const id = `history-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 새 항목 생성
    const newItem: HistoryItem<T> = {
      id,
      timestamp: Date.now(),
      ...item
    };

    // 기록에 항목 추가
    this.history.push(newItem);
    this.currentIndex = this.history.length - 1;

    // 최대 기록 크기 제한
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    // 변경 알림
    this.notifyHistoryChange();

    return id;
  }

  /**
   * 실행 취소 (이전 상태로 되돌리기)
   * @returns 실행 취소된 항목 또는 null
   */
  public undo(): HistoryItem<T> | null {
    if (this.currentIndex <= 0) {
      return null;
    }

    const undoneItem = this.history[this.currentIndex];
    this.currentIndex--;
    
    // 변경 알림
    this.notifyHistoryChange();
    
    return undoneItem;
  }

  /**
   * 다시 실행 (실행 취소된 작업 다시 적용)
   * @returns 다시 실행된 항목 또는 null
   */
  public redo(): HistoryItem<T> | null {
    if (this.currentIndex >= this.history.length - 1) {
      return null;
    }

    this.currentIndex++;
    const redoneItem = this.history[this.currentIndex];
    
    // 변경 알림
    this.notifyHistoryChange();
    
    return redoneItem;
  }

  /**
   * 현재 기록 항목 가져오기
   * @returns 현재 기록 항목 또는 null
   */
  public getCurrentItem(): HistoryItem<T> | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.history.length) {
      return null;
    }
    
    return this.history[this.currentIndex];
  }

  /**
   * 전체 기록 가져오기
   * @returns 기록 항목 배열
   */
  public getHistory(): HistoryItem<T>[] {
    return [...this.history];
  }

  /**
   * 현재 기록 인덱스 가져오기
   * @returns 현재 기록 인덱스
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 실행 취소 가능 여부 확인
   * @returns 실행 취소 가능 여부
   */
  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 다시 실행 가능 여부 확인
   * @returns 다시 실행 가능 여부
   */
  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 기록 모두 지우기
   */
  public clear(): void {
    this.history = [];
    this.currentIndex = -1;
    
    // 변경 알림
    this.notifyHistoryChange();
  }

  /**
   * 히스토리 변경 이벤트 리스너 등록
   * @param callback 콜백 함수
   * @returns 리스너 제거 함수
   */
  public onHistoryChange(callback: () => void): () => void {
    this.onHistoryChangeCallbacks.add(callback);
    return () => {
      this.onHistoryChangeCallbacks.delete(callback);
    };
  }

  /**
   * 히스토리 변경 알림
   */
  private notifyHistoryChange(): void {
    this.onHistoryChangeCallbacks.forEach(callback => callback());
  }
} 