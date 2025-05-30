"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CanvasEngine } from '@/lib/canvas-engine';
import * as fabric from 'fabric';
import { Badge } from './badge';
import { Wand2, Image, FileText, Edit, FileX } from 'lucide-react';

export interface ElementSelectorProps {
  /**
   * CanvasEngine 인스턴스
   */
  canvasEngine: CanvasEngine;
  
  /**
   * 요소 선택 시 호출되는 콜백
   */
  onElementSelected?: (elementId: string, elementType: 'text' | 'image' | 'shape') => void;
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
  
  /**
   * 선택 모드 활성화 여부
   */
  enabled?: boolean;
}

export interface SelectedElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  object: fabric.Object;
}

/**
 * 캔버스 내 요소 선택을 위한 컴포넌트
 */
export function ElementSelector({
  canvasEngine,
  onElementSelected,
  className,
  enabled = true,
}: ElementSelectorProps) {
  // 선택된 요소 상태
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  
  // 마우스 오버된 요소 상태
  const [hoveredElement, setHoveredElement] = useState<SelectedElement | null>(null);
  
  // 선택 모드 상태
  const [selectionMode, setSelectionMode] = useState<boolean>(enabled);
  
  // 캔버스 이벤트 리스너 설정
  useEffect(() => {
    if (!canvasEngine) return;
    
    const canvas = canvasEngine.getFabricCanvas();
    
    // 요소 선택 이벤트 리스너
    const handleObjectSelected = (e: any) => {
      if (!selectionMode) return;
      
      const activeObj = canvas.getActiveObject();
      if (!activeObj) {
        setSelectedElement(null);
        return;
      }
      
      const data = activeObj.get('data') as { id: string; type: 'text' | 'image' | 'shape' } | undefined;
      if (!data || !data.id || !data.type) {
        setSelectedElement(null);
        return;
      }
      
      const newSelectedElement = {
        id: data.id,
        type: data.type,
        object: activeObj
      };
      
      setSelectedElement(newSelectedElement);
      
      // 콜백 호출
      if (onElementSelected) {
        onElementSelected(data.id, data.type);
      }
    };
    
    // 요소 선택 해제 이벤트 리스너
    const handleSelectionCleared = () => {
      setSelectedElement(null);
    };
    
    // 마우스 오버 이벤트 리스너
    const handleMouseOver = (e: any) => {
      if (!selectionMode || !e.target) return;
      
      const data = e.target.get('data') as { id: string; type: 'text' | 'image' | 'shape' } | undefined;
      if (!data || !data.id || !data.type) {
        setHoveredElement(null);
        return;
      }
      
      setHoveredElement({
        id: data.id,
        type: data.type,
        object: e.target
      });
      
      // 커서 변경
      canvas.defaultCursor = 'pointer';
    };
    
    // 마우스 아웃 이벤트 리스너
    const handleMouseOut = () => {
      setHoveredElement(null);
      canvas.defaultCursor = 'default';
    };
    
    // 이벤트 리스너 등록
    canvas.on('selection:created', handleObjectSelected);
    canvas.on('selection:updated', handleObjectSelected);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('mouse:over', handleMouseOver);
    canvas.on('mouse:out', handleMouseOut);
    
    // 클린업 함수
    return () => {
      canvas.off('selection:created', handleObjectSelected);
      canvas.off('selection:updated', handleObjectSelected);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('mouse:over', handleMouseOver);
      canvas.off('mouse:out', handleMouseOut);
    };
  }, [canvasEngine, selectionMode, onElementSelected]);
  
  // enabled prop 변경 감지
  useEffect(() => {
    setSelectionMode(enabled);
  }, [enabled]);
  
  // 요소 타입에 따른 아이콘 렌더링
  const renderElementIcon = (type: 'text' | 'image' | 'shape') => {
    switch (type) {
      case 'text':
        return <FileText className="w-4 h-4 mr-1" />;
      case 'image':
        return <Image className="w-4 h-4 mr-1" />;
      case 'shape':
        return <Edit className="w-4 h-4 mr-1" />;
      default:
        return null;
    }
  };
  
  // 요소 타입에 따른 레이블 렌더링
  const getElementLabel = (type: 'text' | 'image' | 'shape') => {
    switch (type) {
      case 'text':
        return '텍스트';
      case 'image':
        return '이미지';
      case 'shape':
        return '도형';
      default:
        return '알 수 없음';
    }
  };
  
  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {/* 선택 모드 토글 */}
      <div className="flex items-center justify-between">
        <Badge 
          variant={selectionMode ? "default" : "outline"}
          className="cursor-pointer flex items-center"
          onClick={() => setSelectionMode(!selectionMode)}
        >
          <Wand2 className="w-3 h-3 mr-1" />
          {selectionMode ? '선택 모드 활성화' : '선택 모드 비활성화'}
        </Badge>
      </div>
      
      {/* 선택된 요소 정보 */}
      {selectedElement && (
        <div className="p-2 border rounded-md bg-background">
          <div className="text-sm font-medium mb-1 flex items-center">
            {renderElementIcon(selectedElement.type)}
            {getElementLabel(selectedElement.type)} 요소 선택됨
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {selectedElement.id}
          </div>
        </div>
      )}
      
      {/* 요소가 선택되지 않은 경우 */}
      {selectionMode && !selectedElement && (
        <div className="text-sm text-muted-foreground flex items-center">
          <FileX className="w-4 h-4 mr-1" />
          재생성할 요소를 선택해주세요
        </div>
      )}
    </div>
  );
} 