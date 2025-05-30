import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 클래스명을 조합하는 유틸리티 함수
 * 
 * clsx와 tailwind-merge를 결합하여 조건부 클래스명을 처리하고 
 * 충돌하는 Tailwind 클래스를 올바르게 병합합니다.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 바이트 크기를 읽기 쉬운 형식으로 변환합니다.
 * @param bytes 바이트 크기
 * @returns 읽기 쉬운 형식의 크기 문자열 (예: 1.2 KB, 3.5 MB)
 */
export function bytesToSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 디바운스 함수
 * 연속된 호출을 단일 호출로 그룹화하여 마지막 호출만 실행하도록 합니다.
 * 
 * @param func 디바운스할 함수
 * @param wait 대기 시간(밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 쓰로틀 함수
 * 지정된 시간 간격으로 함수 호출 횟수를 제한합니다.
 * 
 * @param func 쓰로틀할 함수
 * @param wait 대기 시간(밀리초)
 * @returns 쓰로틀된 함수
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let isThrottled = false;
  let lastArgs: Parameters<T> | null = null;
  let lastContext: any = null;
  
  function wrapper(this: any, ...args: Parameters<T>) {
    if (isThrottled) {
      lastArgs = args;
      lastContext = this;
      return;
    }
    
    isThrottled = true;
    func.apply(this, args);
    
    setTimeout(() => {
      isThrottled = false;
      
      if (lastArgs) {
        wrapper.apply(lastContext, lastArgs);
        lastArgs = null;
        lastContext = null;
      }
    }, wait);
  }
  
  return wrapper;
}
