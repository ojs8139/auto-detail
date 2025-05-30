"use client";

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SmoothTransitionProps {
  children: ReactNode;
  show: boolean;
  duration?: number;
  className?: string;
  transitionType?: 'fade' | 'slide' | 'scale' | 'height';
  slideDirection?: 'left' | 'right' | 'up' | 'down';
  onTransitionEnd?: () => void;
}

/**
 * 부드러운 전환 효과를 제공하는 컴포넌트
 * @param props 컴포넌트 속성
 * @returns 부드러운 전환 효과가 적용된 컴포넌트
 */
export function SmoothTransition({
  children,
  show,
  duration = 300,
  className,
  transitionType = 'fade',
  slideDirection = 'down',
  onTransitionEnd
}: SmoothTransitionProps) {
  const [shouldRender, setShouldRender] = useState(show);
  const [isMounted, setIsMounted] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number>(0);
  
  // 처음 마운트될 때 show 상태를 반영
  useEffect(() => {
    setIsMounted(true);
    
    // 초기 높이 저장 (height 전환 타입인 경우)
    if (transitionType === 'height' && elementRef.current) {
      heightRef.current = elementRef.current.scrollHeight;
    }
  }, [transitionType]);
  
  // show 상태에 따라 컴포넌트 렌더링 제어
  useEffect(() => {
    if (show) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration]);
  
  // 전환 종료 이벤트 처리
  const handleTransitionEnd = () => {
    if (onTransitionEnd && !show) {
      onTransitionEnd();
    }
  };
  
  // 전환 타입에 따른 클래스 설정
  const getTransitionStyles = () => {
    const transitionProperty = transitionType === 'height' 
      ? 'max-height, opacity' 
      : 'transform, opacity';
      
    const baseStyles = {
      transition: `${transitionProperty} ${duration}ms ease-in-out`,
      overflow: transitionType === 'height' ? 'hidden' : 'visible',
    };
    
    if (!isMounted) return baseStyles;
    
    const states = {
      fade: {
        visible: { opacity: 1 },
        hidden: { opacity: 0 }
      },
      scale: {
        visible: { opacity: 1, transform: 'scale(1)' },
        hidden: { opacity: 0, transform: 'scale(0.9)' }
      },
      slide: {
        visible: { opacity: 1, transform: 'translateY(0)' },
        hidden: { 
          opacity: 0, 
          transform: slideDirection === 'up' ? 'translateY(-20px)' : 
                    slideDirection === 'down' ? 'translateY(20px)' : 
                    slideDirection === 'left' ? 'translateX(-20px)' : 
                    'translateX(20px)' 
        }
      },
      height: {
        visible: { opacity: 1, maxHeight: `${heightRef.current}px` },
        hidden: { opacity: 0, maxHeight: '0px' }
      }
    };
    
    const currentState = show ? states[transitionType].visible : states[transitionType].hidden;
    
    return {
      ...baseStyles,
      ...currentState
    };
  };
  
  if (!shouldRender) return null;
  
  return (
    <div
      ref={elementRef}
      className={cn(className)}
      style={getTransitionStyles()}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}

/**
 * 페이지 전환 효과를 제공하는 컴포넌트
 */
export function PageTransition({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div 
      className={cn(
        "animate-in fade-in slide-in-from-bottom-4 duration-500", 
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * 부드러운 목록 항목 전환 효과를 제공하는 컴포넌트
 */
export function SmoothListItem({
  children,
  index = 0,
  className
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(className)}
      style={{
        opacity: 0,
        transform: 'translateY(10px)',
        animation: `fadeInUp 500ms ease-out forwards`,
        animationDelay: `${index * 100}ms`
      }}
    >
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
} 