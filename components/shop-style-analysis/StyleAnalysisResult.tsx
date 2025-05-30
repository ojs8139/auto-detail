/**
 * 쇼핑몰 스타일 분석 결과 표시 컴포넌트
 * 분석된 쇼핑몰의 스타일 가이드를 시각적으로 표시합니다.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { StyleAnalysisResult as StyleAnalysisResultType } from '@/lib/services/styleAnalysisService';
import type { DetailedStyleAnalysis } from '@/lib/services/aiStyleAnalysisService';

// 컴포넌트 속성 정의
export interface StyleAnalysisResultProps {
  analysis: StyleAnalysisResultType;
  className?: string;
}

/**
 * 색상 팔레트 표시 컴포넌트
 */
function ColorPalette({ colors }: { colors: string[] }) {
  return (
    <div className="flex flex-wrap gap-2 my-2">
      {colors.map((color, index) => (
        <div key={`${color}-${index}`} className="flex flex-col items-center">
          <div
            className="w-10 h-10 rounded-full border"
            style={{ backgroundColor: color }}
            title={color}
          ></div>
          <span className="text-xs mt-1">{color}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * 키워드 리스트 표시 컴포넌트
 */
function KeywordList({ keywords }: { keywords: string[] }) {
  return (
    <div className="flex flex-wrap gap-1 my-2">
      {keywords.map((keyword, index) => (
        <Badge key={index} variant="secondary">
          {keyword}
        </Badge>
      ))}
    </div>
  );
}

/**
 * 스타일 분석 결과 컴포넌트
 */
export function StyleAnalysisResult({ analysis, className = '' }: StyleAnalysisResultProps) {
  if (!analysis) {
    return null;
  }

  const styleGuide = analysis.styleGuide;
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>스타일 분석 결과</CardTitle>
        <CardDescription>
          {analysis.metadata.title || analysis.url}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="colors">색상</TabsTrigger>
            <TabsTrigger value="typography">타이포그래피</TabsTrigger>
            <TabsTrigger value="mood">분위기</TabsTrigger>
            <TabsTrigger value="recommendations">추천사항</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="h-[400px] pr-4">
            {/* 색상 탭 */}
            <TabsContent value="colors" className="space-y-4">
              {styleGuide.dominantColors && styleGuide.dominantColors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">주요 색상</h3>
                  <ColorPalette colors={styleGuide.dominantColors} />
                </div>
              )}
              
              {styleGuide.colors && styleGuide.colors.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">모든 색상</h3>
                  <ColorPalette colors={styleGuide.colors.slice(0, 10)} />
                  {styleGuide.colors.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      외 {styleGuide.colors.length - 10}개 색상
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* 타이포그래피 탭 */}
            <TabsContent value="typography" className="space-y-4">
              {styleGuide.typography && (
                <>
                  <div>
                    <h3 className="text-lg font-medium mb-2">폰트 정보</h3>
                    <p><strong>제목 폰트:</strong> {styleGuide.typography?.heading || '정보 없음'}</p>
                    <p><strong>본문 폰트:</strong> {styleGuide.typography?.body || '정보 없음'}</p>
                  </div>
                  
                  {styleGuide.typography?.pairings && styleGuide.typography.pairings.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">폰트 조합 추천</h3>
                      <ul className="list-disc pl-5">
                        {styleGuide.typography.pairings.map((pair: string, index: number) => (
                          <li key={index}>{pair}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {styleGuide.typography?.description && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">타이포그래피 스타일</h3>
                      <p>{styleGuide.typography.description}</p>
                    </div>
                  )}
                </>
              )}
              
              {!styleGuide.typography && (
                <p className="text-muted-foreground">타이포그래피 정보가 없습니다.</p>
              )}
            </TabsContent>
            
            {/* 분위기 탭 */}
            <TabsContent value="mood" className="space-y-4">
              {styleGuide.mood && (
                <div>
                  <h3 className="text-lg font-medium mb-2">전체 분위기</h3>
                  <p>{styleGuide.mood}</p>
                </div>
              )}
              
              {styleGuide.keywords && styleGuide.keywords.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">키워드</h3>
                  <KeywordList keywords={styleGuide.keywords} />
                </div>
              )}
              
              {styleGuide.targetAudience && (
                <div>
                  <h3 className="text-lg font-medium mb-2">타겟 고객층</h3>
                  <p>{styleGuide.targetAudience}</p>
                </div>
              )}
              
              {styleGuide.designElements && (
                <div>
                  <h3 className="text-lg font-medium mb-2">디자인 요소</h3>
                  {styleGuide.designElements?.patterns && styleGuide.designElements.patterns.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-medium">패턴</h4>
                      <KeywordList keywords={styleGuide.designElements.patterns} />
                    </div>
                  )}
                  {styleGuide.designElements?.shapes && styleGuide.designElements.shapes.length > 0 && (
                    <div className="mb-2">
                      <h4 className="font-medium">모양</h4>
                      <KeywordList keywords={styleGuide.designElements.shapes} />
                    </div>
                  )}
                  {styleGuide.designElements?.iconStyle && (
                    <div>
                      <h4 className="font-medium">아이콘 스타일</h4>
                      <p>{styleGuide.designElements.iconStyle}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            {/* 추천사항 탭 */}
            <TabsContent value="recommendations" className="space-y-4">
              {styleGuide.recommendations && (
                <>
                  {styleGuide.recommendations?.colorUsage && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">색상 사용 추천</h3>
                      <p>{styleGuide.recommendations.colorUsage}</p>
                    </div>
                  )}
                  
                  {styleGuide.recommendations?.typographyUsage && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">타이포그래피 사용 추천</h3>
                      <p>{styleGuide.recommendations.typographyUsage}</p>
                    </div>
                  )}
                  
                  {styleGuide.recommendations?.imageStyle && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">이미지 스타일 추천</h3>
                      <p>{styleGuide.recommendations.imageStyle}</p>
                    </div>
                  )}
                  
                  {styleGuide.recommendations?.layoutSuggestions && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">레이아웃 제안</h3>
                      <p>{styleGuide.recommendations.layoutSuggestions}</p>
                    </div>
                  )}
                </>
              )}
              
              {!styleGuide.recommendations && (
                <p className="text-muted-foreground">추천 사항이 없습니다.</p>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
} 