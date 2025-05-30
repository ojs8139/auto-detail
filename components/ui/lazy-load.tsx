"use client";

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LazyLoadProps {
  children: ReactNode;
  className?: string;
  placeholder?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  effect?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  delay?: number;
  once?: boolean;
  disabled?: boolean;
  onVisible?: () => void;
}

/**
 * 인터섹션 옵저버를 활용한 지연 로딩 컴포넌트
 * 
 * 이 컴포넌트는 뷰포트에 들어왔을 때만 내용을 렌더링하여 초기 로딩 성능을 개선합니다.
 * 또한 다양한 진입 애니메이션 효과를 제공합니다.
 */
export function LazyLoad({
  children,
  className,
  placeholder,
  threshold = 0.1,
  rootMargin = '0px',
  effect = 'fade',
  duration = 500,
  delay = 0,
  once = true,
  disabled = false,
  onVisible
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(disabled);
  const [hasBeenVisible, setHasBeenVisible] = useState(disabled);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 브라우저 환경 확인 (SSR 지원)
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsVisible(true);
      return;
    }
    
    // 이미 비활성화되었거나 한 번 표시된 후 다시 관찰하지 않는 경우
    if (disabled || (once && hasBeenVisible)) {
      setIsVisible(true);
      return;
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      const newIsVisible = entry.isIntersecting;
      
      if (newIsVisible) {
        if (once) {
          setHasBeenVisible(true);
        }
        setIsVisible(true);
        
        if (onVisible) {
          onVisible();
        }
      } else if (!once) {
        setIsVisible(false);
      }
    };

    const observer = new IntersectionObserver(observerCallback, {
      threshold,
      rootMargin
    });

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, once, disabled, hasBeenVisible, onVisible]);

  // 애니메이션 효과 스타일 계산
  const getAnimationStyles = () => {
    if (effect === 'none' || !isVisible) return {};
    
    const baseStyles = {
      transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
      transitionDelay: `${delay}ms`,
    };
    
    if (!isVisible) {
      return {
        ...baseStyles,
        opacity: 0,
        transform: getInitialTransform()
      };
    }
    
    return {
      ...baseStyles,
      opacity: 1,
      transform: 'translate(0, 0) scale(1)'
    };
  };
  
  // 효과에 따른 초기 변환 계산
  const getInitialTransform = () => {
    switch (effect) {
      case 'slide-up':
        return 'translate(0, 20px)';
      case 'slide-down':
        return 'translate(0, -20px)';
      case 'slide-left':
        return 'translate(20px, 0)';
      case 'slide-right':
        return 'translate(-20px, 0)';
      case 'scale':
        return 'scale(0.9)';
      case 'fade':
      default:
        return 'translate(0, 0)';
    }
  };

  return (
    <div 
      ref={ref} 
      className={cn(
        "lazy-load",
        className
      )}
    >
      {(isVisible || hasBeenVisible) ? (
        <div style={getAnimationStyles()}>
          {children}
        </div>
      ) : (
        placeholder || (
          <div 
            className="lazy-load-placeholder" 
            style={{ 
              height: ref.current?.offsetHeight || 'auto',
              width: ref.current?.offsetWidth || '100%'
            }}
          />
        )
      )}
    </div>
  );
}

/**
 * 이미지 지연 로딩 컴포넌트
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  objectFit = 'cover',
  threshold = 0.1,
  rootMargin = '200px',
  placeholderSrc,
  effect = 'fade',
  duration = 500,
  onLoad
}: {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  threshold?: number;
  rootMargin?: string;
  placeholderSrc?: string;
  effect?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  onLoad?: () => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  
  const handleVisible = () => {
    setIsVisible(true);
  };
  
  const handleImageLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  useEffect(() => {
    if (isVisible) {
      setCurrentSrc(src);
    }
  }, [isVisible, src]);
  
  return (
    <LazyLoad
      threshold={threshold}
      rootMargin={rootMargin}
      effect="none"
      onVisible={handleVisible}
      className={className}
    >
      <div 
        className={cn(
          "relative overflow-hidden",
          className
        )}
        style={{ width, height }}
      >
        {currentSrc && (
          <img
            src={currentSrc}
            alt={alt}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0",
              {
                "object-cover": objectFit === 'cover',
                "object-contain": objectFit === 'contain',
                "object-fill": objectFit === 'fill',
                "object-none": objectFit === 'none',
                "object-scale-down": objectFit === 'scale-down',
              },
              "w-full h-full"
            )}
            style={{
              transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
              transform: isLoaded ? 'scale(1)' : 'scale(1.05)',
            }}
            onLoad={handleImageLoad}
          />
        )}
        
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    </LazyLoad>
  );
} 