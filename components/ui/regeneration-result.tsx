"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "./button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { Check, ArrowLeft, Clock, RefreshCw } from "lucide-react";
import type { RegenerationResult } from "@/lib/regeneration-service";
import { cn } from "@/lib/utils";

export interface RegenerationResultProps {
  /**
   * 재생성 결과
   */
  result: RegenerationResult;
  
  /**
   * 적용 버튼 클릭 시 콜백
   */
  onApply?: (result: RegenerationResult) => void;
  
  /**
   * 취소 버튼 클릭 시 콜백
   */
  onCancel?: () => void;
  
  /**
   * 재생성 버튼 클릭 시 콜백
   */
  onRegenerate?: () => void;
  
  /**
   * 요소 타입
   */
  elementType: 'text' | 'image' | 'shape';
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
}

/**
 * 재생성 결과 표시 컴포넌트
 */
export function RegenerationResult({
  result,
  onApply,
  onCancel,
  onRegenerate,
  elementType,
  className,
}: RegenerationResultProps) {
  // 시간 포맷팅 함수
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // 스타일 타입 배지 렌더링
  const renderStyleBadge = () => {
    if (!result.options.style || result.options.style === 'default') return null;
    
    return (
      <Badge variant="secondary" className="ml-2">
        {result.options.style}
      </Badge>
    );
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          {elementType === 'text' ? '텍스트 재생성 결과' : '이미지 재생성 결과'}
          {renderStyleBadge()}
        </CardTitle>
        <div className="text-xs text-muted-foreground flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          {formatTime(result.timestamp)}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="new">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">새 콘텐츠</TabsTrigger>
            <TabsTrigger value="original">원본</TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="mt-2">
            {elementType === 'text' ? (
              <div className="p-3 border rounded-md bg-background min-h-[100px]">
                {result.newContent}
              </div>
            ) : (
              <div className="flex justify-center p-2 border rounded-md bg-background">
                <img 
                  src={result.newContent} 
                  alt="재생성된 이미지" 
                  className="max-h-[200px] object-contain"
                />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="original" className="mt-2">
            {elementType === 'text' ? (
              <div className="p-3 border rounded-md bg-background min-h-[100px]">
                {result.originalContent}
              </div>
            ) : (
              <div className="flex justify-center p-2 border rounded-md bg-background">
                <img 
                  src={result.originalContent} 
                  alt="원본 이미지" 
                  className="max-h-[200px] object-contain"
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* 옵션 요약 */}
        <div className="mt-4 text-xs text-muted-foreground">
          <h4 className="font-medium mb-1">적용된 옵션:</h4>
          <ul className="list-disc pl-5 space-y-1">
            {result.options.style && result.options.style !== 'default' && (
              <li>스타일: {result.options.style}</li>
            )}
            {result.options.preserveFormat && <li>서식 유지</li>}
            {result.options.preserveLength && <li>길이 유지</li>}
            {result.options.preserveKeywords && <li>핵심 키워드 유지</li>}
            {result.options.preserveContext && <li>컨텍스트 유지</li>}
            {!Object.keys(result.options).some(key => 
              key !== 'style' && result.options[key as keyof typeof result.options]
            ) && <li>기본 설정</li>}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onCancel}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          취소
        </Button>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRegenerate}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            다시 생성
          </Button>
          <Button 
            size="sm" 
            onClick={() => onApply?.(result)}
          >
            <Check className="mr-1 h-4 w-4" />
            적용
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 