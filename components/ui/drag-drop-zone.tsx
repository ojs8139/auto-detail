"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { UploadCloud } from 'lucide-react';

export interface DragDropZoneProps {
  onFileDrop: (file: File) => void;
  onUrlDrop?: (url: string) => void;
  className?: string;
  children?: React.ReactNode;
  acceptMimeTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  dragActiveClassName?: string;
  maxFileSizeMB?: number;
  dropTargetRef?: React.RefObject<HTMLElement>;
  isGlobalDrop?: boolean;
}

export function DragDropZone({
  onFileDrop,
  onUrlDrop,
  className,
  children,
  acceptMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  multiple = false,
  disabled = false,
  dragActiveClassName,
  maxFileSizeMB = 10,
  dropTargetRef,
  isGlobalDrop = false,
}: DragDropZoneProps) {
  // 드래그 상태
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [isInvalidType, setIsInvalidType] = useState<boolean>(false);
  
  // 최대 파일 크기 (바이트)
  const maxFileSize = maxFileSizeMB * 1024 * 1024;
  
  // 내부 참조
  const zoneRef = useRef<HTMLDivElement>(null);
  
  // 파일 유효성 검사
  const isValidFile = useCallback((file: File): boolean => {
    // 크기 확인
    if (file.size > maxFileSize) {
      console.warn(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      return false;
    }
    
    // MIME 타입 확인
    if (acceptMimeTypes.length > 0 && !acceptMimeTypes.includes(file.type)) {
      console.warn(`Invalid file type: ${file.type}`);
      return false;
    }
    
    return true;
  }, [acceptMimeTypes, maxFileSize]);
  
  // 이미지 URL 추출 시도
  const extractImageUrl = useCallback((text: string): string | null => {
    // URL 확인
    try {
      const url = new URL(text);
      
      // 이미지 확장자 확인
      const path = url.pathname.toLowerCase();
      if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || 
          path.endsWith('.webp') || path.endsWith('.gif') || path.endsWith('.svg')) {
        return url.href;
      }
      
      // 이미지 URL 패턴 확인
      if (url.pathname.includes('/image/') || url.pathname.includes('/img/')) {
        return url.href;
      }
    } catch (error) {
      return null;
    }
    
    return null;
  }, []);
  
  // 드래그 이벤트 핸들러
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // 파일 확인
    const hasFiles = e.dataTransfer?.types.includes('Files') || false;
    const hasUrl = (e.dataTransfer?.types.includes('text/uri-list') || 
                  e.dataTransfer?.types.includes('text/plain')) || false;
    
    // 이미지 파일 확인
    let hasValidFiles = false;
    if (hasFiles && e.dataTransfer?.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file' && acceptMimeTypes.includes(item.type)) {
          hasValidFiles = true;
          break;
        }
      }
    }
    
    setIsDragActive(hasValidFiles || hasUrl);
    setIsInvalidType(hasFiles && !hasValidFiles);
  }, [disabled, acceptMimeTypes]);
  
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // 드롭 효과 설정
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled]);
  
  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    // 실제로 영역을 벗어났는지 확인
    if (zoneRef.current && !zoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
      setIsInvalidType(false);
    }
  }, [disabled]);
  
  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    setIsDragActive(false);
    setIsInvalidType(false);
    
    // 파일 처리
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      
      // 유효한 파일만 필터링
      const validFiles = files.filter(isValidFile);
      
      if (validFiles.length === 0) {
        console.warn('No valid files dropped');
        return;
      }
      
      // 다중 선택 여부에 따라 처리
      if (multiple) {
        validFiles.forEach(file => onFileDrop(file));
      } else {
        onFileDrop(validFiles[0]);
      }
    } 
    // URL 처리
    else if (onUrlDrop && e.dataTransfer?.items) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        
        if (item.kind === 'string' && 
            (item.type === 'text/uri-list' || item.type === 'text/plain')) {
          item.getAsString((text) => {
            const imageUrl = extractImageUrl(text);
            if (imageUrl) {
              onUrlDrop(imageUrl);
            }
          });
          break;
        }
      }
    }
  }, [disabled, isValidFile, multiple, onFileDrop, onUrlDrop, extractImageUrl]);
  
  // 전역 드롭 이벤트 핸들링
  useEffect(() => {
    if (!isGlobalDrop) return;
    
    const targetElement = dropTargetRef?.current || document.body;
    
    // 이벤트 리스너 등록
    targetElement.addEventListener('dragenter', handleDragEnter);
    targetElement.addEventListener('dragover', handleDragOver);
    targetElement.addEventListener('dragleave', handleDragLeave);
    targetElement.addEventListener('drop', handleDrop);
    
    return () => {
      targetElement.removeEventListener('dragenter', handleDragEnter);
      targetElement.removeEventListener('dragover', handleDragOver);
      targetElement.removeEventListener('dragleave', handleDragLeave);
      targetElement.removeEventListener('drop', handleDrop);
    };
  }, [
    isGlobalDrop, 
    dropTargetRef, 
    handleDragEnter, 
    handleDragOver, 
    handleDragLeave, 
    handleDrop
  ]);
  
  return (
    <div
      ref={zoneRef}
      className={cn(
        'relative border-2 border-dashed rounded-md p-6 transition-colors',
        'flex flex-col items-center justify-center text-sm',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20',
        isInvalidType ? 'border-destructive/50 bg-destructive/5' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        isDragActive && dragActiveClassName,
        className
      )}
      onDragEnter={!isGlobalDrop ? (e: React.DragEvent) => handleDragEnter(e as unknown as DragEvent) : undefined}
      onDragOver={!isGlobalDrop ? (e: React.DragEvent) => handleDragOver(e as unknown as DragEvent) : undefined}
      onDragLeave={!isGlobalDrop ? (e: React.DragEvent) => handleDragLeave(e as unknown as DragEvent) : undefined}
      onDrop={!isGlobalDrop ? (e: React.DragEvent) => handleDrop(e as unknown as DragEvent) : undefined}
    >
      {children || (
        <>
          <UploadCloud 
            className={cn(
              'mb-2 h-10 w-10',
              isDragActive ? 'text-primary' : 'text-muted-foreground/60',
              isInvalidType ? 'text-destructive/60' : ''
            )} 
          />
          <div className="text-center space-y-1">
            <p className="font-medium">
              {isDragActive 
                ? '파일을 놓아주세요' 
                : isInvalidType 
                  ? '지원되지 않는 파일 형식입니다'
                  : '파일을 드래그하거나 클릭하세요'}
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptMimeTypes.map(type => type.replace('image/', '.')).join(', ')} 파일 지원
            </p>
            <p className="text-xs text-muted-foreground">
              최대 {maxFileSizeMB}MB
            </p>
          </div>
        </>
      )}
    </div>
  );
} 