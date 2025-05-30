/**
 * 웹 워커 사용을 위한 커스텀 훅
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface WorkerOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (error: ErrorEvent) => void;
  dependencies?: any[];
}

/**
 * 웹 워커 사용을 위한 커스텀 훅
 * @param workerPath 웹 워커 파일 경로
 * @param options 웹 워커 옵션
 * @returns 웹 워커 관련 상태 및 함수
 */
export function useWorker(
  workerPath: string,
  options: WorkerOptions = {}
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const { onMessage, onError, dependencies = [] } = options;

  // 웹 워커 초기화
  useEffect(() => {
    // 서버 사이드 렌더링 환경 확인
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      setIsLoading(false);
      setError(new Error('웹 워커를 지원하지 않는 환경입니다.'));
      return;
    }

    try {
      // 웹 워커 생성
      workerRef.current = new Worker(workerPath, { type: 'module' });
      setIsLoading(false);

      // 메시지 이벤트 리스너
      const handleMessage = (event: MessageEvent) => {
        if (onMessage) {
          onMessage(event);
        }
      };

      // 에러 이벤트 리스너
      const handleError = (event: ErrorEvent) => {
        if (onError) {
          onError(event);
        }
        setError(new Error(`웹 워커 오류: ${event.message}`));
      };

      // 이벤트 리스너 등록
      workerRef.current.addEventListener('message', handleMessage);
      workerRef.current.addEventListener('error', handleError);

      // 클린업 함수
      return () => {
        if (workerRef.current) {
          workerRef.current.removeEventListener('message', handleMessage);
          workerRef.current.removeEventListener('error', handleError);
          workerRef.current.terminate();
          workerRef.current = null;
        }
      };
    } catch (err) {
      setIsLoading(false);
      setError(err instanceof Error ? err : new Error('웹 워커를 초기화하는 중 오류가 발생했습니다.'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerPath, ...dependencies]);

  /**
   * 웹 워커에 메시지 전송
   * @param message 전송할 메시지
   * @param transferables 전송할 Transferable 객체 목록
   */
  const postMessage = useCallback(
    (message: any, transferables?: Transferable[]) => {
      if (!workerRef.current) {
        throw new Error('웹 워커가 초기화되지 않았습니다.');
      }

      if (transferables) {
        workerRef.current.postMessage(message, transferables);
      } else {
        workerRef.current.postMessage(message);
      }
    },
    []
  );

  /**
   * 웹 워커 종료
   */
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  return {
    isLoading,
    error,
    worker: workerRef.current,
    postMessage,
    terminate
  };
}

/**
 * 이미지 처리 웹 워커를 위한 커스텀 훅
 */
export function useImageProcessor() {
  // 서버 사이드 렌더링 환경에서 에러 방지
  const workerPath = typeof window !== 'undefined' 
    ? new URL('/lib/workers/image-processor.worker.ts', import.meta.url).href
    : '';
  
  const [results, setResults] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 웹 워커 메시지 핸들러
  const handleMessage = useCallback((event: MessageEvent) => {
    const { id, type, success, imageData, error } = event.data;
    
    setResults(prev => ({
      ...prev,
      [id]: { type, success, imageData, error }
    }));
    
    setIsProcessing(false);
  }, []);
  
  // 웹 워커 생성
  const { isLoading, error, postMessage } = useWorker(
    workerPath,
    { onMessage: handleMessage }
  );
  
  /**
   * 이미지 처리 요청
   */
  const processImage = useCallback(
    (type: string, id: string, imageData: ImageData | ArrayBuffer, params: any) => {
      setIsProcessing(true);
      
      // 전송 가능한 객체 확인
      const transferables = imageData instanceof ArrayBuffer ? [imageData] : [];
      
      // 메시지 전송
      postMessage(
        { type, id, imageData, params },
        transferables
      );
    },
    [postMessage]
  );
  
  return {
    isLoading,
    error,
    results,
    isProcessing,
    processImage
  };
} 