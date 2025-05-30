"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImageAsset } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  images: ImageAsset[];
  onRemove?: (id: string) => void;
  className?: string;
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  priority?: boolean;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onClick?: () => void;
}

export function ImagePreview({ 
  images, 
  onRemove,
  className = ""
}: ImagePreviewProps) {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${className}`}>
      {images.map((image) => (
        <div key={image.id} className="relative group rounded-lg overflow-hidden border">
          <img
            src={image.path}
            alt={`Image ${image.id}`}
            className="w-full h-48 object-cover"
          />
          {onRemove && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(image.id);
                }}
              >
                삭제
              </Button>
            </div>
          )}
          <div className="p-2 text-xs">
            {image.metadata?.format && (
              <div className="text-muted-foreground">
                {image.metadata.format.split('/')[1]?.toUpperCase() || image.metadata.format}
              </div>
            )}
            {image.metadata?.size && (
              <div className="text-muted-foreground">
                {formatFileSize(image.metadata.size)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// 파일 크기 포맷팅 함수
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 최적화된 이미지 프리뷰 컴포넌트
 * Next.js의 Image 컴포넌트를 사용하여 이미지 최적화 및 지연 로딩을 구현합니다.
 */
export default function OptimizedImage({
  src,
  alt,
  width = 500,
  height = 300,
  className,
  quality = 85,
  priority = false,
  objectFit = "cover",
  onLoad,
  onClick,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [error, setError] = useState<boolean>(false);

  // 이미지 소스가 변경될 때 로딩 상태 초기화
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setImageSrc(src);
  }, [src]);

  // 데이터 URL 또는 외부 URL에 따라 처리 방식 구분
  const isDataUrl = src.startsWith('data:');
  const isExternalUrl = src.startsWith('http') && !src.startsWith(window.location.origin);

  // 로딩 핸들러
  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  // 에러 핸들러
  const handleError = () => {
    setIsLoading(false);
    setError(true);
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isLoading && "animate-pulse bg-muted",
        className
      )}
      style={{ width, height }}
      onClick={onClick}
    >
      {!error ? (
        isDataUrl || isExternalUrl ? (
          // 데이터 URL 또는 외부 URL은 일반 img 태그 사용
          <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            className={cn(
              "transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100",
              objectFit === "cover" && "object-cover",
              objectFit === "contain" && "object-contain",
              objectFit === "fill" && "object-fill",
              objectFit === "none" && "object-none",
              objectFit === "scale-down" && "object-scale-down",
              "w-full h-full"
            )}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? "eager" : "lazy"}
          />
        ) : (
          // 내부 이미지는 Next.js Image 컴포넌트 사용
          <Image
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            quality={quality}
            priority={priority}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100",
              objectFit === "cover" && "object-cover",
              objectFit === "contain" && "object-contain",
              objectFit === "fill" && "object-fill",
              objectFit === "none" && "object-none",
              objectFit === "scale-down" && "object-scale-down",
              "w-full h-full"
            )}
            style={{
              objectFit: objectFit
            }}
            // 캐싱 최적화 설정
            unoptimized={isDataUrl}
            // 이미지 중요도에 따른 preload 설정
            loading={priority ? "eager" : "lazy"}
          />
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
          이미지를 불러올 수 없습니다
        </div>
      )}
    </div>
  );
} 