'use client';

/**
 * 쇼핑몰 스타일 분석 페이지
 * 사용자가 쇼핑몰 URL을 입력하고 스타일 분석 결과를 확인할 수 있는 페이지입니다.
 */

import React, { useState } from 'react';
import { UrlInputForm } from '@/components/shop-style-analysis/UrlInputForm';
import { StyleAnalysisResult as StyleAnalysisResultComponent } from '@/components/shop-style-analysis/StyleAnalysisResult';
import { StyleAnalysisResult } from '@/lib/services/styleAnalysisService';
import { analyzeStyleWithAI } from '@/lib/services/aiStyleAnalysisService';
import { enrichStyleAnalysis } from '@/lib/services/aiStyleAnalysisService';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

export default function ShopStyleAnalysisPage() {
  // 상태 관리
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StyleAnalysisResult | null>(null);
  const { toast } = useToast();

  /**
   * URL을 받아 쇼핑몰 스타일을 분석합니다.
   * @param url 분석할 쇼핑몰 URL
   */
  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    
    try {
      // 1. 웹사이트 스크래핑 API 호출
      const response = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '스크래핑 실패');
      }
      
      const scrapedData = await response.json();
      
      // 2. 기본 스타일 분석 결과 생성
      const basicAnalysis: StyleAnalysisResult = {
        url,
        metadata: scrapedData.metadata,
        styleGuide: {
          colors: scrapedData.colors,
          fonts: scrapedData.fonts,
        },
        images: scrapedData.images.slice(0, 20), // 최대 20개 이미지만 저장
      };
      
      // 3. OpenAI로 더 상세한 스타일 분석
      toast({
        title: 'AI 분석 중',
        description: '스크래핑된 데이터를 바탕으로 AI가 스타일을 분석하고 있습니다...',
      });
      
      // AI 분석 API 호출
      const aiAnalysisResponse = await fetch('/api/ai/analyze-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: scrapedData.metadata?.title || '',
          description: scrapedData.metadata?.description || '',
          colors: scrapedData.colors || [],
          fonts: scrapedData.fonts || [],
          imageCount: scrapedData.images?.length || 0,
          products: scrapedData.products || [],
        }),
      });
      
      if (!aiAnalysisResponse.ok) {
        const errorData = await aiAnalysisResponse.json();
        throw new Error(errorData.error || 'AI 분석 실패');
      }
      
      const aiAnalysisData = await aiAnalysisResponse.json();
      
      // 4. 두 분석 결과 통합
      const enrichedAnalysis = enrichStyleAnalysis(basicAnalysis, aiAnalysisData.analysis);
      
      // 5. 결과 저장 및 표시
      setAnalysisResult(enrichedAnalysis);
      
      toast({
        title: '분석 완료',
        description: '쇼핑몰 스타일 분석이 완료되었습니다.',
      });
    } catch (error) {
      console.error('스타일 분석 오류:', error);
      toast({
        title: '분석 실패',
        description: `쇼핑몰 스타일 분석 중 오류가 발생했습니다: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">쇼핑몰 분위기 분석</h1>
        <p className="text-muted-foreground">
          쇼핑몰 URL을 입력하면 색상, 폰트, 디자인 요소를 분석하여 스타일 가이드를 생성합니다.
        </p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <UrlInputForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
        </CardContent>
      </Card>
      
      {analysisResult && (
        <StyleAnalysisResultComponent analysis={analysisResult} />
      )}
      
      {isAnalyzing && (
        <div className="flex justify-center p-8">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-32 w-32 rounded-full bg-secondary mb-4"></div>
            <div className="h-4 w-64 bg-secondary rounded mb-2"></div>
            <div className="h-4 w-40 bg-secondary rounded"></div>
          </div>
        </div>
      )}
    </div>
  );
} 