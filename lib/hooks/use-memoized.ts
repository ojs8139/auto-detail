/**
 * 메모이제이션 및 성능 최적화를 위한 커스텀 훅
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce, throttle } from '@/lib/utils';

/**
 * 이전 값과 현재 값을 비교하는 커스텀 훅
 * @param value 비교할 값
 * @returns 이전 값
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * 디바운스된 값을 반환하는 커스텀 훅
 * @param value 디바운스할 값
 * @param delay 지연 시간 (밀리초)
 * @returns 디바운스된 값
 */
export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * 디바운스된 콜백을 반환하는 커스텀 훅
 * @param callback 디바운스할 콜백 함수
 * @param delay 지연 시간 (밀리초)
 * @param deps 의존성 배열
 * @returns 디바운스된 콜백 함수
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500,
  deps: any[] = []
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(debounce(callback, delay), deps) as T;
}

/**
 * 쓰로틀된 콜백을 반환하는 커스텀 훅
 * @param callback 쓰로틀할 콜백 함수
 * @param delay 지연 시간 (밀리초)
 * @param deps 의존성 배열
 * @returns 쓰로틀된 콜백 함수
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: any[] = []
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(throttle(callback, delay), deps) as T;
}

/**
 * 메모이제이션된 객체를 생성하는 커스텀 훅
 * 객체의 내용이 동일한 경우 동일한 참조를 유지합니다.
 * @param obj 메모이제이션할 객체
 * @returns 메모이제이션된 객체
 */
export function useMemoizedObject<T extends object>(obj: T): T {
  const previousObj = useRef<T>(obj);
  
  return useMemo(() => {
    // 얕은 비교를 통해 객체 내용이 변경되었는지 확인
    const keys = Object.keys(obj);
    const previousKeys = Object.keys(previousObj.current);
    
    // 키 개수가 다르면 새 객체 반환
    if (keys.length !== previousKeys.length) {
      previousObj.current = obj;
      return obj;
    }
    
    // 모든 키의 값이 동일한지 확인
    const hasChanged = keys.some(key => {
      return obj[key as keyof T] !== previousObj.current[key as keyof T];
    });
    
    // 변경된 경우 새 객체 반환, 그렇지 않으면 이전 객체 유지
    if (hasChanged) {
      previousObj.current = obj;
      return obj;
    }
    
    return previousObj.current;
  }, [obj]);
}

/**
 * 비용이 많이 드는 계산을 메모이제이션하는 커스텀 훅
 * @param factory 계산 함수
 * @param deps 의존성 배열
 * @returns 메모이제이션된 계산 결과
 */
export function useExpensiveCalculation<T>(
  factory: () => T,
  deps: any[] = []
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

/**
 * 딥 메모이제이션을 위한 커스텀 훅
 * 중첩된 객체 구조를 가진 복잡한 데이터를 비교하여 메모이제이션합니다.
 * @param value 메모이제이션할 값
 * @returns 메모이제이션된 값
 */
export function useDeepMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  
  return useMemo(() => {
    // 깊은 비교를 통해 값이 변경되었는지 확인
    if (JSON.stringify(value) !== JSON.stringify(ref.current)) {
      ref.current = value;
      return value;
    }
    return ref.current;
  }, [value]);
} 