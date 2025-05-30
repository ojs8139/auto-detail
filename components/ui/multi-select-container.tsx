"use client";

import { useState, useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface MultiSelectContainerProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export interface SelectableItem {
  id: string;
  ref: HTMLElement;
  isSelected: boolean;
}

// 컨텍스트를 생성하는 대신 간단한 레지스트리를 사용
const selectableItems = new Map<string, SelectableItem>();

export function registerSelectableItem(id: string, ref: HTMLElement): void {
  selectableItems.set(id, { id, ref, isSelected: false });
}

export function unregisterSelectableItem(id: string): void {
  selectableItems.delete(id);
}

export function updateSelectableItemState(id: string, isSelected: boolean): void {
  const item = selectableItems.get(id);
  if (item) {
    item.isSelected = isSelected;
  }
}

export function MultiSelectContainer({
  children,
  className,
  style,
  onSelectionChange,
  ...props
}: MultiSelectContainerProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 마우스 다운 이벤트 처리
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // 좌클릭만 처리
    
    // 컨테이너 기준 좌표 계산
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Shift 키가 눌리지 않은 경우 선택 초기화
    if (!e.shiftKey) {
      setSelectedIds([]);
      
      // 모든 아이템의 선택 상태 초기화
      selectableItems.forEach(item => {
        item.isSelected = false;
      });
    }
    
    setIsSelecting(true);
    setStartPoint({ x, y });
    setSelectionRect({ x, y, width: 0, height: 0 });
  };
  
  // 마우스 이동 이벤트 처리
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // 선택 영역 계산
    const width = Math.abs(currentX - startPoint.x);
    const height = Math.abs(currentY - startPoint.y);
    const x = Math.min(currentX, startPoint.x);
    const y = Math.min(currentY, startPoint.y);
    
    setSelectionRect({ x, y, width, height });
    
    // 선택 영역과 교차하는 아이템 확인
    const newSelectedIds = [...selectedIds];
    
    selectableItems.forEach(item => {
      const itemRect = item.ref.getBoundingClientRect();
      const itemX = itemRect.left - rect.left;
      const itemY = itemRect.top - rect.top;
      const itemRight = itemX + itemRect.width;
      const itemBottom = itemY + itemRect.height;
      
      // 선택 영역과 아이템의 교차 확인
      const isIntersecting = 
        x < itemRight && 
        x + width > itemX && 
        y < itemBottom && 
        y + height > itemY;
      
      if (isIntersecting && !newSelectedIds.includes(item.id)) {
        newSelectedIds.push(item.id);
        item.isSelected = true;
      } else if (!isIntersecting && !e.shiftKey) {
        const index = newSelectedIds.indexOf(item.id);
        if (index > -1) {
          newSelectedIds.splice(index, 1);
          item.isSelected = false;
        }
      }
    });
    
    setSelectedIds(newSelectedIds);
  };
  
  // 마우스 업 이벤트 처리
  const handleMouseUp = () => {
    setIsSelecting(false);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  };
  
  // 컴포넌트 언마운트 시 이벤트 정리
  useEffect(() => {
    return () => {
      if (isSelecting) {
        setIsSelecting(false);
      }
    };
  }, [isSelecting]);
  
  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      style={style}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {children}
      
      {/* 선택 영역 표시 */}
      {isSelecting && (
        <div
          className="absolute border border-primary/50 bg-primary/10 pointer-events-none z-10"
          style={{
            left: `${selectionRect.x}px`,
            top: `${selectionRect.y}px`,
            width: `${selectionRect.width}px`,
            height: `${selectionRect.height}px`,
          }}
        />
      )}
    </div>
  );
} 