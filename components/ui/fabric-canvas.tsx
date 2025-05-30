"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Canvas, Object as FabricObject } from 'fabric';
import { CanvasEngine } from '@/lib/canvas-engine';

// fabric.js 모듈 임포트 도우미 함수
const importFabric = async () => {
  const fabricModule = await import('fabric');
  return fabricModule.default || fabricModule;
};

// 디바운스 유틸리티 함수 추가
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

interface FabricCanvasProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: number;
  height?: number;
  onReady?: (canvas: Canvas, engine: CanvasEngine) => void;
  onObjectSelected?: (e: any) => void;
  onSelectionCleared?: () => void;
}

export function FabricCanvas({
  width = 800,
  height = 600,
  className,
  onReady,
  onObjectSelected,
  onSelectionCleared,
  ...props
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  // requestAnimationFrame 참조 저장
  const rafRef = useRef<number | null>(null);

  // Fabric.js 초기화 - useCallback으로 최적화
  const initFabric = useCallback(async () => {
    try {
      if (canvasRef.current && !fabricCanvasRef.current) {
        // Fabric.js 모듈 캐싱 개선
        const fabric = await importFabric();
        
        // 캔버스 초기화 및 최적화 옵션 추가
        const canvas = new fabric.Canvas(canvasRef.current, {
          width,
          height,
          backgroundColor: 'white',
          preserveObjectStacking: true,
          selection: true,
          // 성능 개선을 위한 옵션
          enableRetinaScaling: false, // 레티나 디스플레이에서 배율 적용 비활성화
          renderOnAddRemove: false, // 요소 추가/제거 시 자동 렌더링 비활성화
          stateful: false, // 상태 추적 최소화
        });

        // 캔버스 이벤트 핸들러 추가
        if (onObjectSelected) {
          canvas.on('selection:created', onObjectSelected);
          canvas.on('selection:updated', onObjectSelected);
        }
        
        if (onSelectionCleared) {
          canvas.on('selection:cleared', onSelectionCleared);
        }
        
        // 캔버스 렌더링 최적화
        const optimizedRender = debounce(() => {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
          
          rafRef.current = requestAnimationFrame(() => {
            canvas.requestRenderAll();
            rafRef.current = null;
          });
        }, 5);
        
        // 캔버스 이벤트에 최적화된 렌더링 연결
        canvas.on('object:modified', optimizedRender);
        canvas.on('object:added', optimizedRender);
        canvas.on('object:removed', optimizedRender);
        
        // CanvasEngine 초기화
        const engine = new CanvasEngine(canvasRef.current, {
          width,
          height,
          backgroundColor: 'white',
          preserveObjectStacking: true,
          selection: true,
        });
        
        fabricCanvasRef.current = canvas;
        engineRef.current = engine;
        setIsReady(true);
        
        if (onReady) {
          onReady(canvas, engine);
        }
      }
    } catch (error) {
      console.error('Fabric.js 초기화 오류:', error);
    }
  }, [width, height, onReady, onObjectSelected, onSelectionCleared]);

  // 컴포넌트 마운트 시 Fabric.js 초기화
  useEffect(() => {
    initFabric();

    // 컴포넌트 언마운트 시 캔버스 및 리소스 정리
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      
      // CanvasEngine 정리
      engineRef.current = null;
      
      // Animation Frame 정리
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [initFabric]);

  // 캔버스 크기 변경 시 리사이징 처리
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setWidth(width);
      fabricCanvasRef.current.setHeight(height);
      
      // 최적화된 방식으로 렌더링
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.requestRenderAll();
        }
        rafRef.current = null;
      });
    }
  }, [width, height]);

  return (
    <div 
      className={cn("relative border rounded-md overflow-hidden", className)} 
      {...props}
    >
      <canvas ref={canvasRef} />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-r-transparent rounded-full" />
        </div>
      )}
    </div>
  );
}

// 캔버스 헬퍼 함수 - 메모이제이션으로 최적화
export const CanvasHelpers = {
  // 텍스트 추가 헬퍼 - 최적화
  addText: async (canvas: Canvas, options: any = {}) => {
    if (!canvas) return null;
    
    const { text = '텍스트를 입력하세요', left = 50, top = 50, ...rest } = options;
    const fabric = await importFabric();
    
    // 일괄 처리를 위해 렌더링 일시 중지
    canvas.renderOnAddRemove = false;
    
    const textObj = new fabric.Textbox(text, {
      left,
      top,
      width: 200,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#000000',
      ...rest
    });
    
    canvas.add(textObj);
    canvas.setActiveObject(textObj);
    
    // 일괄 처리 후 한 번에 렌더링
    canvas.renderOnAddRemove = true;
    canvas.requestRenderAll();
    
    return textObj;
  },
  
  // 이미지 추가 헬퍼 - 최적화
  addImage: async (canvas: Canvas, src: string, options: any = {}) => {
    if (!canvas || !src) return null;
    
    const { left = 50, top = 50, ...rest } = options;
    const fabric = await importFabric();
    
    // 이미지 로딩 최적화
    return new Promise((resolve, reject) => {
      // 이미지 로드 중 렌더링 일시 중지
      canvas.renderOnAddRemove = false;
      
      // 이미지 캐싱 처리
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const imgObj = new fabric.Image(img, {
          left,
          top,
          ...rest
        });
        
        // 이미지 크기 조정 (너무 큰 경우)
        if (imgObj.width && imgObj.height) {
          const maxSize = 300;
          if (imgObj.width > maxSize || imgObj.height > maxSize) {
            const scale = maxSize / Math.max(imgObj.width, imgObj.height);
            imgObj.scale(scale);
          }
        }
        
        canvas.add(imgObj);
        canvas.setActiveObject(imgObj);
        
        // 일괄 처리 후 한 번에 렌더링
        canvas.renderOnAddRemove = true;
        canvas.requestRenderAll();
        
        resolve(imgObj);
      };
      
      img.onerror = () => {
        canvas.renderOnAddRemove = true;
        reject(new Error('이미지 로드 실패'));
      };
      
      img.src = src;
    });
  },
  
  // 도형 추가 헬퍼 - 최적화
  addShape: async (canvas: Canvas, shape: 'rect' | 'circle' | 'triangle', options: any = {}) => {
    if (!canvas) return null;
    
    const { left = 50, top = 50, width = 100, height = 100, fill = '#cccccc', ...rest } = options;
    const fabric = await importFabric();
    
    // 일괄 처리를 위해 렌더링 일시 중지
    canvas.renderOnAddRemove = false;
    
    let shapeObj;
    
    switch (shape) {
      case 'rect':
        shapeObj = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill,
          ...rest
        });
        break;
      case 'circle':
        shapeObj = new fabric.Circle({
          left,
          top,
          radius: Math.min(width, height) / 2,
          fill,
          ...rest
        });
        break;
      case 'triangle':
        shapeObj = new fabric.Triangle({
          left,
          top,
          width,
          height,
          fill,
          ...rest
        });
        break;
      default:
        canvas.renderOnAddRemove = true;
        throw new Error(`지원하지 않는 도형 타입: ${shape}`);
    }
    
    canvas.add(shapeObj);
    canvas.setActiveObject(shapeObj);
    
    // 일괄 처리 후 한 번에 렌더링
    canvas.renderOnAddRemove = true;
    canvas.requestRenderAll();
    
    return shapeObj;
  },
  
  // 선택한 객체 삭제 - 최적화
  removeSelected: async (canvas: Canvas) => {
    if (!canvas) return;
    
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) return;
    
    // 일괄 처리를 위해 렌더링 일시 중지
    canvas.renderOnAddRemove = false;
    
    canvas.discardActiveObject();
    
    activeObjects.forEach((obj: FabricObject) => {
      canvas.remove(obj);
    });
    
    // 일괄 처리 후 한 번에 렌더링
    canvas.renderOnAddRemove = true;
    canvas.requestRenderAll();
  },
  
  // 캔버스를 이미지로 내보내기 - 최적화
  exportToImage: (canvas: Canvas, format: 'png' | 'jpeg' = 'png', quality: number = 1, multiplier: number = 2) => {
    if (!canvas) return '';
    
    // 내보내기 전 모든 렌더링이 완료되도록 보장
    canvas.requestRenderAll();
    
    return canvas.toDataURL({
      format,
      quality,
      multiplier // 고해상도 출력을 위한 배율
    });
  }
}; 