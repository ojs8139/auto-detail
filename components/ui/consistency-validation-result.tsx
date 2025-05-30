"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./card";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import { Button } from "./button";
import { Progress } from "./progress";
import { Separator } from "./separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { CheckCircle, AlertTriangle, AlertCircle, InfoIcon, XCircle } from "lucide-react";
import { ValidationResult, ValidationIssue } from "@/lib/validation-service";
import { ConsistencyValidationResult } from "@/lib/consistency-validator";
import { cn } from "@/lib/utils";

export interface ConsistencyValidationUIProps {
  /**
   * 검증 결과
   */
  validationResult: ConsistencyValidationResult;
  
  /**
   * 상세 정보 표시 여부
   */
  showDetails?: boolean;
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
  
  /**
   * 수정 요청 클릭 시 호출되는 콜백
   */
  onRequestFix?: () => void;
  
  /**
   * 닫기 버튼 클릭 시 호출되는 콜백
   */
  onClose?: () => void;
}

/**
 * 일관성 검증 결과 UI 컴포넌트
 */
export function ConsistencyValidationUI({
  validationResult,
  showDetails = false,
  className,
  onRequestFix,
  onClose
}: ConsistencyValidationUIProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails);
  
  const { validation } = validationResult;
  const { isValid, score, issues, suggestions } = validation;
  
  // 이슈 카운트
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;
  
  // 전체 상태 결정
  const getStatusIcon = () => {
    if (isValid && issues.length === 0) {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    
    if (errorCount > 0) {
      return <XCircle className="h-6 w-6 text-red-500" />;
    }
    
    if (warningCount > 0) {
      return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
    
    return <InfoIcon className="h-6 w-6 text-blue-500" />;
  };
  
  // 상태 텍스트
  const getStatusText = () => {
    if (isValid && issues.length === 0) {
      return '통과';
    }
    
    if (errorCount > 0) {
      return '실패';
    }
    
    if (warningCount > 0) {
      return '경고';
    }
    
    return '정보';
  };
  
  // 배지 색상
  const getBadgeVariant = () => {
    if (isValid && issues.length === 0) {
      return 'success';
    }
    
    if (errorCount > 0) {
      return 'destructive';
    }
    
    if (warningCount > 0) {
      return 'warning';
    }
    
    return 'secondary';
  };
  
  // 이슈 심각도별 아이콘
  const getIssueIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <InfoIcon className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };
  
  // 점수 퍼센트 계산
  const scorePercent = Math.round(score * 100);
  
  // 점수 색상 클래스
  const getScoreColorClass = () => {
    if (scorePercent >= 90) return 'text-green-600';
    if (scorePercent >= 75) return 'text-emerald-600';
    if (scorePercent >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">일관성 검증 결과</CardTitle>
            <Badge variant={getBadgeVariant() as any}>{getStatusText()}</Badge>
          </div>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              닫기
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-3">
        {/* 점수 표시 */}
        <div className="mb-4 flex flex-col space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">일관성 점수</span>
            <span className={cn("font-bold", getScoreColorClass())}>{scorePercent}%</span>
          </div>
          <Progress value={scorePercent} className="h-2" />
        </div>
        
        {/* 간략 요약 */}
        <div className="mb-4">
          <Alert variant={!isValid ? "destructive" : "default"}>
            <AlertTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>{isValid ? '검증 통과' : '검증 실패'}</span>
            </AlertTitle>
            <AlertDescription>
              {isValid && issues.length === 0 
                ? '컨텍스트 일관성 검증을 성공적으로 통과했습니다.' 
                : errorCount > 0 
                  ? `${errorCount}개의 오류와 ${warningCount}개의 경고가 발견되었습니다.` 
                  : warningCount > 0 
                    ? `${warningCount}개의 경고 사항이 있습니다.` 
                    : '낮은 심각도의 일관성 문제가 있을 수 있습니다.'}
            </AlertDescription>
          </Alert>
        </div>
        
        {/* 상세 정보 토글 버튼 */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 w-full justify-center"
        >
          {isExpanded ? '상세 정보 숨기기' : '상세 정보 보기'}
        </Button>
        
        {/* 상세 정보 */}
        {isExpanded && (
          <>
            {/* 이슈 목록 */}
            {issues.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">발견된 이슈</h4>
                <Accordion type="multiple" className="w-full">
                  {issues.map((issue, index) => (
                    <AccordionItem key={index} value={`issue-${index}`}>
                      <AccordionTrigger className="py-2">
                        <div className="flex items-center space-x-2 text-sm">
                          {getIssueIcon(issue.severity)}
                          <span>
                            {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)} 이슈
                          </span>
                          <Badge variant={
                            issue.severity === 'error' ? 'destructive' :
                            'secondary'
                          }>
                            {issue.severity === 'error' ? '오류' : 
                             issue.severity === 'warning' ? '경고' : '정보'}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">
                          {issue.message}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            
            {/* 제안 사항 */}
            {suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">제안 사항</h4>
                <ul className="text-sm space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="pl-5 relative">
                      <div className="absolute left-0 top-1.5 w-1 h-1 rounded-full bg-primary"></div>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* 하단 버튼 */}
      {!isValid && onRequestFix && (
        <CardFooter className="flex justify-end">
          <Button 
            variant="default" 
            size="sm" 
            onClick={onRequestFix}
          >
            일관성 문제 수정 요청
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 