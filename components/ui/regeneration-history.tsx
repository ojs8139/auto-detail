"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./card";
import { Button } from "./button";
import { ScrollArea } from "./scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Badge } from "./badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { RotateCcw, CheckCircle, ArrowLeft, ArrowRight, History, RefreshCcw } from "lucide-react";
import type { RegenerationResult } from "@/lib/regeneration-service";
import { cn } from "@/lib/utils";

export interface RegenerationHistoryProps {
  /**
   * 요소 ID
   */
  elementId: string;
  
  /**
   * 요소 타입
   */
  elementType: 'text' | 'image' | 'shape';
  
  /**
   * 히스토리 데이터
   */
  history: RegenerationResult[];
  
  /**
   * 특정 버전으로 롤백 시 호출되는 콜백
   */
  onRollback?: (elementId: string, resultId: string) => void;
  
  /**
   * 마지막 재생성 작업 실행 취소 시 호출되는 콜백
   */
  onUndo?: (elementId: string) => void;
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
}

/**
 * 시간 포맷 함수
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * 날짜 포맷 함수
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * 재생성 작업 타입 추출 함수
 */
function getOperationType(result: RegenerationResult): string {
  if (result.options.isRollback) return '롤백';
  if (result.options.isUndo) return '실행 취소';
  if (result.options.transformations) return '이미지 변형';
  if (result.options.cropArea) return '이미지 크롭';
  
  return '재생성';
}

/**
 * 재생성 히스토리 컴포넌트
 */
export function RegenerationHistory({
  elementId,
  elementType,
  history,
  onRollback,
  onUndo,
  className,
}: RegenerationHistoryProps) {
  // 선택된 히스토리 항목
  const [selectedItem, setSelectedItem] = useState<RegenerationResult | null>(null);
  
  // 히스토리 그룹화 (날짜별)
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, RegenerationResult[]> = {};
    
    history.forEach(item => {
      const date = formatDate(item.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
    });
    
    return Object.entries(groups).map(([date, items]) => ({
      date,
      items: items.sort((a, b) => b.timestamp - a.timestamp)
    }));
  }, [history]);
  
  // 히스토리가 변경되면 가장 최근 항목을 선택
  useEffect(() => {
    if (history.length > 0 && !selectedItem) {
      setSelectedItem(history[history.length - 1]);
    }
  }, [history, selectedItem]);
  
  // 히스토리 항목 선택 핸들러
  const handleSelectItem = (item: RegenerationResult) => {
    setSelectedItem(item);
  };
  
  // 롤백 핸들러
  const handleRollback = () => {
    if (selectedItem && onRollback) {
      onRollback(elementId, selectedItem.id);
    }
  };
  
  // 실행 취소 핸들러
  const handleUndo = () => {
    if (onUndo) {
      onUndo(elementId);
    }
  };
  
  // 선택된 히스토리 항목의 인덱스 계산
  const selectedIndex = selectedItem 
    ? history.findIndex(item => item.id === selectedItem.id)
    : -1;
  
  // 이전/다음 항목 선택 핸들러
  const handlePrevious = () => {
    if (selectedIndex > 0) {
      setSelectedItem(history[selectedIndex - 1]);
    }
  };
  
  const handleNext = () => {
    if (selectedIndex < history.length - 1) {
      setSelectedItem(history[selectedIndex + 1]);
    }
  };
  
  // 적용된 옵션 요약 렌더링
  const renderOptionSummary = (options: RegenerationResult['options']) => {
    const optionItems: string[] = [];
    
    if (typeof options.style === 'string' && options.style !== 'default') {
      optionItems.push(`스타일: ${options.style}`);
    }
    
    if (options.preserveFormat) optionItems.push('서식 유지');
    if (options.preserveLength) optionItems.push('길이 유지');
    if (options.preserveKeywords) optionItems.push('키워드 유지');
    if (options.preserveContext) optionItems.push('컨텍스트 유지');
    
    if (options.isRollback) optionItems.push('롤백');
    if (options.isUndo) optionItems.push('실행 취소');
    
    return optionItems.length > 0 ? optionItems.join(', ') : '기본 설정';
  };
  
  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>아직 히스토리가 없습니다.</p>
          <p className="text-sm">재생성 작업을 실행하면 여기에 기록됩니다.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <History className="h-5 w-5 mr-2" />
          재생성 히스토리
          <Badge variant="outline" className="ml-2">
            {history.length}개
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {/* 좌측: 히스토리 목록 */}
        <div className="border-r">
          <ScrollArea className="h-[300px]">
            {groupedHistory.map(group => (
              <div key={group.date} className="mb-4">
                <div className="px-4 py-2 text-sm font-medium text-muted-foreground">
                  {group.date}
                </div>
                
                {group.items.map(item => (
                  <div
                    key={item.id}
                    className={cn(
                      "px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground",
                      selectedItem?.id === item.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {getOperationType(item)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(item.timestamp)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 truncate">
                      {renderOptionSummary(item.options)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </ScrollArea>
        </div>
        
        {/* 우측: 선택된 항목 상세 */}
        <div className="col-span-2">
          {selectedItem && (
            <div className="h-[300px] flex flex-col">
              <Tabs defaultValue="new" className="flex-1">
                <div className="px-4 pt-4 border-b">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="new">새 콘텐츠</TabsTrigger>
                    <TabsTrigger value="original">원본</TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="new" className="flex-1 p-4 overflow-auto">
                  {elementType === 'text' ? (
                    <div className="whitespace-pre-wrap">
                      {selectedItem.newContent}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <img 
                        src={selectedItem.newContent} 
                        alt="재생성된 이미지" 
                        className="max-h-[200px] max-w-full object-contain"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="original" className="flex-1 p-4 overflow-auto">
                  {elementType === 'text' ? (
                    <div className="whitespace-pre-wrap">
                      {selectedItem.originalContent}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <img 
                        src={selectedItem.originalContent} 
                        alt="원본 이미지" 
                        className="max-h-[200px] max-w-full object-contain"
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <CardFooter className="border-t p-4 flex justify-between">
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handlePrevious}
                          disabled={selectedIndex <= 0}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>이전 버전</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleNext}
                          disabled={selectedIndex >= history.length - 1}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>다음 버전</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="flex space-x-2">
                  {selectedIndex < history.length - 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRollback}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      이 버전으로 복원
                    </Button>
                  )}
                  
                  {selectedIndex === history.length - 1 && history.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleUndo}
                    >
                      <RefreshCcw className="h-4 w-4 mr-1" />
                      마지막 작업 취소
                    </Button>
                  )}
                  
                  {selectedIndex === history.length - 1 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="sm" variant="ghost" className="pointer-events-none">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            현재 적용됨
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>현재 적용된 버전입니다</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </CardFooter>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
} 