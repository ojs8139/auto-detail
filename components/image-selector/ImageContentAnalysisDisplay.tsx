/**
 * 이미지 내용 분석 결과 표시 컴포넌트
 * OpenAI API로 분석한 이미지 내용 정보를 시각적으로 표시합니다.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageContentAnalysis } from '@/lib/services/imageContentAnalysisService';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Image, Palette, Tag, ThumbsUp, Bookmark, Info, LayoutGrid } from 'lucide-react';

export interface ImageContentAnalysisDisplayProps {
  analysis: ImageContentAnalysis;
  className?: string;
  showDetails?: boolean;
  onClick?: () => void;
}

/**
 * 색상 뱃지 컴포넌트
 */
const ColorBadge: React.FC<{ color: string; isActive?: boolean }> = ({ color, isActive = false }) => {
  const displayColor = color.startsWith('#') ? color : `#${color}`;
  const textColor = getContrastYIQ(displayColor);
  
  return (
    <div 
      className={`rounded-md h-8 min-w-12 flex items-center justify-center px-2 text-xs font-semibold ${isActive ? 'ring-2 ring-blue-500' : ''}`}
      style={{ 
        backgroundColor: displayColor,
        color: textColor
      }}
    >
      {color}
    </div>
  );
};

/**
 * 텍스트 대비색 계산 (YIQ 공식 사용)
 */
function getContrastYIQ(hexcolor: string): string {
  // 기본값 설정
  if (!hexcolor || !hexcolor.startsWith('#') || hexcolor.length < 7) {
    return '#000000';
  }
  
  // RGB 값 추출
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  
  // YIQ 공식 (인간의 눈이 느끼는 밝기)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // 128보다 밝으면 검은색, 어두우면 흰색 반환
  return (yiq >= 128) ? '#000000' : '#ffffff';
}

/**
 * 점수 표시 컴포넌트
 */
const ScoreDisplay: React.FC<{ 
  label: string; 
  score: number; 
  details?: string;
  icon?: React.ReactNode;
}> = ({ label, score, details, icon }) => {
  const scorePercent = score * 100;
  
  // 점수에 따른 색상 설정
  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.6) return 'bg-blue-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-medium">{Math.round(scorePercent)}%</span>
      </div>
      <Progress value={scorePercent} className="h-2" 
        indicatorClassName={getScoreColor(score)} 
      />
      {details && <p className="text-xs text-gray-500 mt-1">{details}</p>}
    </div>
  );
};

/**
 * 이미지 내용 분석 결과 표시 컴포넌트
 */
const ImageContentAnalysisDisplay: React.FC<ImageContentAnalysisDisplayProps> = ({ 
  analysis, 
  className = '',
  showDetails = true,
  onClick
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // 이미지 파일명 추출
  const getImageFilename = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'image';
      
      // 파일명이 너무 길면 축약
      return filename.length > 20 
        ? filename.substring(0, 17) + '...' 
        : filename;
    } catch (e) {
      // URL 파싱 실패 시 기본값 반환
      return 'image';
    }
  };
  
  const imageName = getImageFilename(analysis.imageUrl);
  
  // 섹션 라벨 변환
  const getSectionLabel = (section: string): string => {
    switch(section) {
      case 'main': return '메인 이미지';
      case 'detail': return '상세 이미지';
      case 'lifestyle': return '라이프스타일';
      case 'specification': return '스펙/설명';
      default: return '기타';
    }
  };
  
  return (
    <Card className={`overflow-hidden ${className}`} onClick={onClick}>
      <div className="relative">
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          <img 
            src={analysis.imageUrl} 
            alt={`Image content analysis for ${imageName}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 left-2">
            <Badge 
              variant={analysis.contentType.isProduct ? "default" : "secondary"}
              className="text-xs"
            >
              {analysis.contentType.isProduct ? '제품' : 
                analysis.contentType.isLifestyle ? '라이프스타일' : 
                analysis.contentType.isInfographic ? '인포그래픽' : 
                analysis.contentType.isPerson ? '인물' : '기타'}
            </Badge>
          </div>
          <div className="absolute bottom-2 right-2">
            <Badge 
              variant="outline"
              className="bg-white/90 text-xs"
            >
              {getSectionLabel(analysis.recommendedUse.section)}
            </Badge>
          </div>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-start">
          <span className="truncate">{imageName}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        {showDetails ? (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4 h-8">
              <TabsTrigger value="overview" className="text-xs">개요</TabsTrigger>
              <TabsTrigger value="details" className="text-xs">상세 정보</TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">색상</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-0">
              <ScoreDisplay 
                label="제품 중심도" 
                score={analysis.productFocus.score} 
                details={analysis.productFocus.details}
                icon={<Image className="h-3.5 w-3.5 text-blue-500" />}
              />
              
              <ScoreDisplay 
                label="배경 적합성" 
                score={analysis.backgroundSuitability.score} 
                details={analysis.backgroundSuitability.details}
                icon={<LayoutGrid className="h-3.5 w-3.5 text-blue-500" />}
              />
              
              <ScoreDisplay 
                label="상업적 가치" 
                score={analysis.commercialValue.score} 
                details={analysis.commercialValue.details}
                icon={<ThumbsUp className="h-3.5 w-3.5 text-blue-500" />}
              />
              
              <div className="mt-2">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Bookmark className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-medium">권장 사용처</span>
                </div>
                <p className="text-xs text-gray-600">{analysis.recommendedUse.reason}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4 mt-0">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-medium">이미지 콘텐츠 유형</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{analysis.contentType.details}</p>
                
                <div className="flex flex-wrap gap-1">
                  {analysis.contentType.isProduct && (
                    <Badge variant="outline" className="text-xs">제품</Badge>
                  )}
                  {analysis.contentType.isLifestyle && (
                    <Badge variant="outline" className="text-xs">라이프스타일</Badge>
                  )}
                  {analysis.contentType.isInfographic && (
                    <Badge variant="outline" className="text-xs">인포그래픽</Badge>
                  )}
                  {analysis.contentType.isPerson && (
                    <Badge variant="outline" className="text-xs">인물</Badge>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-medium">분위기</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{analysis.mood.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {analysis.mood.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Tag className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-medium">식별된 객체</span>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">주요 객체:</span> {analysis.objects.main}
                </div>
                {analysis.objects.others.length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">기타 객체:</span> {analysis.objects.others.join(', ')}
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="colors" className="space-y-4 mt-0">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Palette className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-sm font-medium">색상 스킴</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">지배적 색상:</div>
                    <div className="flex gap-1.5">
                      <ColorBadge color={analysis.colorScheme.dominant} isActive />
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-gray-600 mb-1">주요 색상:</div>
                    <div className="flex gap-1.5">
                      <ColorBadge color={analysis.colorScheme.primary} />
                    </div>
                  </div>
                  
                  {analysis.colorScheme.secondary.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">보조 색상:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.colorScheme.secondary.map((color, index) => (
                          <ColorBadge key={index} color={color} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-3">
            <ScoreDisplay 
              label="제품 중심도" 
              score={analysis.productFocus.score}
              icon={<Image className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <ScoreDisplay 
              label="상업적 가치" 
              score={analysis.commercialValue.score}
              icon={<ThumbsUp className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <div className="flex flex-wrap gap-1 mt-2">
              {analysis.mood.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageContentAnalysisDisplay; 