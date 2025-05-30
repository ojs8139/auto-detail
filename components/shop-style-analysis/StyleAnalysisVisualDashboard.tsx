/**
 * 스타일 분석 시각화 대시보드 컴포넌트
 * 스타일 분석 결과를 그래프와 차트로 시각화합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StyleAnalysisResult } from '@/lib/services/styleAnalysisService';
import { DetailedStyleAnalysis } from '@/lib/services/aiStyleAnalysisService';
import { Loader2, PieChart, BarChart3, Palette, Type, Grid3X3, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// 시각화 탭 타입
type VisualizationTab = 'colors' | 'typography' | 'layout' | 'elements' | 'overview';

// 컴포넌트 속성 정의
export interface StyleAnalysisVisualDashboardProps {
  analysisResult: StyleAnalysisResult;
  aiAnalysis?: DetailedStyleAnalysis;
  isLoading?: boolean;
  className?: string;
}

/**
 * 색상 그래프 컴포넌트
 */
const ColorGraph: React.FC<{ colors: string[] }> = ({ colors }) => {
  // 색상별 퍼센트 계산 (간단한 구현)
  const colorsWithPercentage = colors.slice(0, 8).map((color, index) => ({
    color,
    percentage: 100 - (index * 10) // 단순 계산: 첫 번째 색상이 가장 높은 비율
  }));

  return (
    <div className="mt-4">
      {colorsWithPercentage.map((color, index) => (
        <div key={index} className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: color.color }}
              />
              <span className="text-sm">{color.color}</span>
            </div>
            <span className="text-sm font-medium">{Math.round(color.percentage)}%</span>
          </div>
          <Progress value={color.percentage} className="h-2" />
        </div>
      ))}
    </div>
  );
};

/**
 * 스타일 분석 시각화 대시보드 컴포넌트
 */
const StyleAnalysisVisualDashboard: React.FC<StyleAnalysisVisualDashboardProps> = ({
  analysisResult,
  aiAnalysis,
  isLoading = false,
  className = '',
}) => {
  // 현재 선택된 탭
  const [activeTab, setActiveTab] = useState<VisualizationTab>('overview');

  // 분석 결과가 없는 경우 로딩 상태 표시
  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            스타일 분석 시각화
          </CardTitle>
          <CardDescription>분석 데이터 로딩 중...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">분석 데이터를 준비하고 있습니다...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 분석 결과나 AI 분석이 없는 경우 오류 표시
  if (!analysisResult && !aiAnalysis) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-yellow-500" />
            분석 데이터 없음
          </CardTitle>
          <CardDescription>시각화할 분석 데이터가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent className="h-60 flex items-center justify-center">
          <p className="text-gray-500">먼저 사이트 분석을 실행해주세요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>스타일 분석 시각화</CardTitle>
        <CardDescription>
          {analysisResult.metadata?.title || '웹사이트'} 스타일 분석 결과 시각화
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* 탭 메뉴 */}
        <div className="flex space-x-1 mb-6 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <PieChart className="h-4 w-4" />
              <span>개요</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'colors'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Palette className="h-4 w-4" />
              <span>색상</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('typography')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'typography'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Type className="h-4 w-4" />
              <span>타이포그래피</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'layout'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Grid3X3 className="h-4 w-4" />
              <span>레이아웃</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('elements')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'elements'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span>디자인요소</span>
            </div>
          </button>
        </div>

        {/* 탭 내용 */}
        <div className="mt-4">
          {/* 개요 탭 */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">스타일 개요</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">
                    {aiAnalysis?.brandMood?.description || '분석된 브랜드 무드 설명이 없습니다.'}
                  </p>
                  {aiAnalysis?.brandMood?.keywords && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {aiAnalysis.brandMood.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white text-xs rounded-full border border-gray-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-medium text-gray-500">주요 색상</h3>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.styleGuide.colors?.slice(0, 5).map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className="w-10 h-10 rounded-md border border-gray-200 shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs mt-1">{idx < 5 ? (100 - idx * 15) : 10}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-500">사용 폰트</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2 text-sm">
                    {analysisResult.styleGuide.fonts?.slice(0, 5).map((font, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span>{font}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <h3 className="text-sm font-medium text-gray-500">레이아웃</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">헤더:</span>{' '}
                      <span>{analysisResult.styleGuide.layout?.hasHeader ? '있음' : '없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">푸터:</span>{' '}
                      <span>{analysisResult.styleGuide.layout?.hasFooter ? '있음' : '없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">네비게이션:</span>{' '}
                      <span>{analysisResult.styleGuide.layout?.hasNavigation ? '있음' : '없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">사이드바:</span>{' '}
                      <span>{analysisResult.styleGuide.layout?.hasSidebar ? '있음' : '없음'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 색상 탭 */}
          {activeTab === 'colors' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">색상 분포</h3>
              {analysisResult.styleGuide.colors && analysisResult.styleGuide.colors.length > 0 ? (
                <ColorGraph colors={analysisResult.styleGuide.colors} />
              ) : (
                <p className="text-gray-500">색상 데이터가 없습니다.</p>
              )}

              {aiAnalysis?.colorPalette && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-sm font-medium text-gray-500">색상 팔레트 추천</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-xs font-medium mb-2">주요 색상</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.colorPalette.primary.map((color, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div
                              className="w-10 h-10 rounded-md border border-gray-200 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-xs mt-1">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium mb-2">보조 색상</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.colorPalette.secondary.map((color, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div
                              className="w-10 h-10 rounded-md border border-gray-200 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-xs mt-1">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-xs font-medium mb-2">강조 색상</h4>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.colorPalette.accent.map((color, idx) => (
                          <div key={idx} className="flex flex-col items-center">
                            <div
                              className="w-10 h-10 rounded-md border border-gray-200 shadow-sm"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                            <span className="text-xs mt-1">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 타이포그래피 탭 */}
          {activeTab === 'typography' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-4">사용 폰트</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <ul className="space-y-2">
                  {analysisResult.styleGuide.fonts?.map((font, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      <span className="text-sm">{font}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {aiAnalysis?.typography && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500">폰트 추천</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium mb-2">제목 폰트</h4>
                      <div className="py-3 px-4 bg-gray-50 rounded border border-gray-100">
                        <p style={{ fontFamily: aiAnalysis.typography.headingFont }} className="text-lg">
                          {aiAnalysis.typography.headingFont}
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium mb-2">본문 폰트</h4>
                      <div className="py-3 px-4 bg-gray-50 rounded border border-gray-100">
                        <p style={{ fontFamily: aiAnalysis.typography.bodyFont }}>
                          {aiAnalysis.typography.bodyFont}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {aiAnalysis.typography.styleDescription && (
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <h4 className="text-xs font-medium mb-2">타이포그래피 스타일 설명</h4>
                      <p className="text-sm">{aiAnalysis.typography.styleDescription}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 레이아웃 탭 */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-4">레이아웃 구성</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <div className={`rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-2
                      ${analysisResult.styleGuide.layout?.hasHeader 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'}`}>
                      {analysisResult.styleGuide.layout?.hasHeader ? '✓' : '×'}
                    </div>
                    <span className="text-sm">헤더</span>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <div className={`rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-2
                      ${analysisResult.styleGuide.layout?.hasNavigation 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'}`}>
                      {analysisResult.styleGuide.layout?.hasNavigation ? '✓' : '×'}
                    </div>
                    <span className="text-sm">내비게이션</span>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <div className={`rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-2
                      ${analysisResult.styleGuide.layout?.hasSidebar 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'}`}>
                      {analysisResult.styleGuide.layout?.hasSidebar ? '✓' : '×'}
                    </div>
                    <span className="text-sm">사이드바</span>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                    <div className={`rounded-full mx-auto w-8 h-8 flex items-center justify-center mb-2
                      ${analysisResult.styleGuide.layout?.hasFooter 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'}`}>
                      {analysisResult.styleGuide.layout?.hasFooter ? '✓' : '×'}
                    </div>
                    <span className="text-sm">푸터</span>
                  </div>
                </div>
              </div>
              
              {analysisResult.styleGuide.layout && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500">레이아웃 특성</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium mb-2">레이아웃 유형</h4>
                      <p className="bg-gray-50 p-2 rounded text-sm">
                        {analysisResult.styleGuide.layout.layoutType || '일반 레이아웃'}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-xs font-medium mb-2">주요 기술</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.styleGuide.layout.gridSystem && (
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            Grid System
                          </span>
                        )}
                        {analysisResult.styleGuide.layout.flexboxUsed && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                            Flexbox
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full">
                          Responsive
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {aiAnalysis?.recommendations?.layoutSuggestions && (
                <div className="bg-gray-50 p-4 rounded-lg mt-4">
                  <h4 className="text-xs font-medium mb-2">레이아웃 추천</h4>
                  <p className="text-sm">{aiAnalysis.recommendations.layoutSuggestions}</p>
                </div>
              )}
            </div>
          )}

          {/* 디자인 요소 탭 */}
          {activeTab === 'elements' && (
            <div className="space-y-6">
              {aiAnalysis?.designElements && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">디자인 요소</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {aiAnalysis.designElements.patterns && aiAnalysis.designElements.patterns.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h4 className="text-xs font-medium mb-2">패턴</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.designElements.patterns.map((pattern, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200">
                                {pattern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {aiAnalysis.designElements.shapes && aiAnalysis.designElements.shapes.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <h4 className="text-xs font-medium mb-2">형태</h4>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.designElements.shapes.map((shape, idx) => (
                              <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200">
                                {shape}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {aiAnalysis.designElements.iconStyle && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
                        <h4 className="text-xs font-medium mb-2">아이콘 스타일</h4>
                        <p className="text-sm bg-gray-50 p-2 rounded">
                          {aiAnalysis.designElements.iconStyle}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {analysisResult.images && analysisResult.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">이미지 스타일</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {analysisResult.images.slice(0, 6).map((imageUrl, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="h-32 overflow-hidden">
                          <img 
                            src={imageUrl} 
                            alt={`사이트 이미지 ${idx+1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* 이미지별 색상 분석 결과가 없으므로 표시하지 않음 */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {aiAnalysis?.recommendations?.imageStyle && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-medium mb-2">이미지 스타일 추천</h4>
                  <p className="text-sm">{aiAnalysis.recommendations.imageStyle}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StyleAnalysisVisualDashboard; 