"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface ResizableItemProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initialWidth?: number;
  initialHeight?: number;
  minWidth?: number;
  minHeight?: number;
  onResize?: (width: number, height: number) => void;
  onRotate?: (angle: number) => void;
}

export function ResizableItem({
  children,
  className,
  style,
  initialWidth = 200,
  initialHeight = 200,
  minWidth = 50,
  minHeight = 50,
  onResize,
  onRotate,
  ...props
}: ResizableItemProps) {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);
  const [angle, setAngle] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 요소 크기 조절 처리
  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    direction: 'se' | 'sw' | 'ne' | 'nw'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = width;
    const startHeight = height;
    
    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      switch (direction) {
        case 'se':
          newWidth = Math.max(minWidth, startWidth + (e.clientX - startX));
          newHeight = Math.max(minHeight, startHeight + (e.clientY - startY));
          break;
        case 'sw':
          newWidth = Math.max(minWidth, startWidth - (e.clientX - startX));
          newHeight = Math.max(minHeight, startHeight + (e.clientY - startY));
          break;
        case 'ne':
          newWidth = Math.max(minWidth, startWidth + (e.clientX - startX));
          newHeight = Math.max(minHeight, startHeight - (e.clientY - startY));
          break;
        case 'nw':
          newWidth = Math.max(minWidth, startWidth - (e.clientX - startX));
          newHeight = Math.max(minHeight, startHeight - (e.clientY - startY));
          break;
      }
      
      setWidth(newWidth);
      setHeight(newHeight);
      
      if (onResize) {
        onResize(newWidth, newHeight);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 요소 회전 처리
  const handleRotateMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
    const initialAngle = angle;
    
    const handleMouseMove = (e: MouseEvent) => {
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
      const newAngle = initialAngle + (currentAngle - startAngle);
      
      setAngle(newAngle);
      
      if (onRotate) {
        onRotate(newAngle);
      }
    };
    
    const handleMouseUp = () => {
      setIsRotating(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // 마운트 해제 시 이벤트 리스너 정리
  useEffect(() => {
    return () => {
      if (isResizing || isRotating) {
        document.removeEventListener('mousemove', () => {});
        document.removeEventListener('mouseup', () => {});
      }
    };
  }, [isResizing, isRotating]);
  
  return (
    <div
      ref={containerRef}
      className={cn(
        'relative',
        className
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        transform: `rotate(${angle}deg)`,
        ...style,
      }}
      {...props}
    >
      {children}
      
      {/* 크기 조절 핸들 */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize rounded-br-sm"
        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
      />
      <div
        className="absolute bottom-0 left-0 w-4 h-4 bg-primary cursor-sw-resize rounded-bl-sm"
        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
      />
      <div
        className="absolute top-0 right-0 w-4 h-4 bg-primary cursor-ne-resize rounded-tr-sm"
        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
      />
      <div
        className="absolute top-0 left-0 w-4 h-4 bg-primary cursor-nw-resize rounded-tl-sm"
        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
      />
      
      {/* 회전 핸들 */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 w-4 h-4 bg-secondary cursor-grab rounded-full"
        onMouseDown={handleRotateMouseDown}
      />
    </div>
  );
} 