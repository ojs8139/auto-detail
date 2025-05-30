/**
 * 스타일 분석 페이지
 * 쇼핑몰 스타일 분석 결과를 시각화하는 페이지입니다.
 */

'use client';

import React, { useState } from 'react';
import { UrlInputForm } from '@/components/shop-style-analysis/UrlInputForm';
import AnalysisProgressIndicator, { AnalysisStep } from '@/components/shop-style-analysis/AnalysisProgressIndicator';
import StyleAnalysisVisualDashboard from '@/components/shop-style-analysis/StyleAnalysisVisualDashboard';
import { useToast } from '@/components/ui/use-toast';

// 초기 분석 단계
const initialSteps: AnalysisStep[] = [
  { id: 'fetch', name: '웹사이트 데이터 수집', status: 'pending' },
  { id: 'extract', name: '스타일 요소 추출', status: 'pending' },
  { id: 'analyze', name: '스타일 분석', status: 'pending' },
  { id: 'generate', name: '스타일 가이드 생성', status: 'pending' },
];

export default function StyleAnalysisPage() {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | undefined>(undefined);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // 스타일 분석 실행 함수
  const handleAnalyze = async (url: string) => {
    try {
      setIsAnalyzing(true);
      setIsCompleted(false);
      setAnalysisError(undefined);
      setAnalysisResult(null);
      setAiAnalysis(null);
      
      // 분석 단계 초기화
      setAnalysisSteps(initialSteps);
      setCurrentStep(0);
      
      // 1. 웹사이트 데이터 수집 단계
      updateAnalysisStep('fetch', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1500)); // 데모용 지연
      
      // TODO: 실제 API 호출로 대체
      // const fetchResponse = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`);
      // if (!fetchResponse.ok) throw new Error('웹사이트 데이터 수집에 실패했습니다.');
      // const scrapedData = await fetchResponse.json();
      
      updateAnalysisStep('fetch', 'completed');
      setCurrentStep(1);
      
      // 2. 스타일 요소 추출 단계
      updateAnalysisStep('extract', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 데모용 지연
      
      updateAnalysisStep('extract', 'completed');
      setCurrentStep(2);
      
      // 3. 스타일 분석 단계
      updateAnalysisStep('analyze', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 2500)); // 데모용 지연
      
      updateAnalysisStep('analyze', 'completed');
      setCurrentStep(3);
      
      // 4. 스타일 가이드 생성 단계
      updateAnalysisStep('generate', 'in-progress');
      await new Promise(resolve => setTimeout(resolve, 1500)); // 데모용 지연
      
      // 데모용 결과 데이터 설정
      setAnalysisResult({
        metadata: { title: '데모 쇼핑몰' },
        colors: [
          { color: '#3b82f6', percentage: 35 },
          { color: '#f43f5e', percentage: 25 },
          { color: '#10b981', percentage: 15 },
          { color: '#f59e0b', percentage: 15 },
          { color: '#6366f1', percentage: 10 }
        ],
        fonts: ['Roboto', 'Noto Sans KR', 'Open Sans', 'Lato', 'Montserrat'],
        layout: {
          hasHeader: true,
          hasFooter: true,
          hasNavigation: true,
          hasSidebar: false,
          gridSystem: true,
          flexboxUsed: true,
          layoutType: '반응형 그리드 기반'
        },
        images: [
          { url: 'https://placehold.co/600x400/3b82f6/white?text=Demo', dominantColors: [{ color: '#3b82f6', percentage: 90 }] },
          { url: 'https://placehold.co/600x400/f43f5e/white?text=Demo', dominantColors: [{ color: '#f43f5e', percentage: 90 }] },
          { url: 'https://placehold.co/600x400/10b981/white?text=Demo', dominantColors: [{ color: '#10b981', percentage: 90 }] }
        ]
      });
      
      setAiAnalysis({
        colorPalette: {
          primary: ['#3b82f6', '#2563eb'],
          secondary: ['#f43f5e', '#e11d48'],
          accent: ['#10b981', '#f59e0b'],
          background: ['#ffffff', '#f9fafb']
        },
        typography: {
          headingFont: 'Roboto',
          bodyFont: 'Noto Sans KR',
          fontPairings: ['Roboto + Noto Sans KR', 'Open Sans + Lato'],
          styleDescription: '모던하고 깔끔한 타이포그래피로 가독성을 높인 디자인'
        },
        designElements: {
          patterns: ['그라데이션', '그림자 효과', '둥근 모서리'],
          shapes: ['사각형', '원형', '유기적 형태'],
          iconStyle: '라인 아이콘과 채워진 아이콘의 혼합 사용'
        },
        brandMood: {
          description: '현대적이고 밝은 분위기의 브랜드 이미지를 갖추고 있으며, 젊고 트렌디한 감성을 전달합니다.',
          keywords: ['모던', '밝음', '트렌디', '세련된', '미니멀'],
          targetAudience: '20-30대 디지털 친화적 소비자'
        },
        recommendations: {
          colorUsage: '주 색상인 파란색과 빨간색의 대비를 활용하여 중요 요소를 강조하고, 그린과 노란색 계열을 액센트로 사용하세요.',
          typographyUsage: 'Roboto를 헤딩에, Noto Sans KR을 본문에 적용하여 읽기 쉬운 콘텐츠를 제공하세요.',
          imageStyle: '밝고 선명한 제품 이미지를 일관된 배경과 함께 사용하여 통일감 있는 시각적 경험을 제공하세요.',
          layoutSuggestions: '그리드 기반 레이아웃을 유지하되, 여백을 충분히 활용하여 콘텐츠의 가독성을 높이세요.'
        }
      });
      
      updateAnalysisStep('generate', 'completed');
      setIsCompleted(true);
      
      toast({
        title: '분석 완료',
        description: '쇼핑몰 스타일 분석이 완료되었습니다.',
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      setAnalysisError(errorMessage);
      
      // 현재 진행 중인 단계를 오류 상태로 변경
      const currentStepId = analysisSteps[currentStep].id;
      updateAnalysisStep(currentStepId, 'error', errorMessage);
      
      toast({
        title: '분석 실패',
        description: `쇼핑몰 스타일 분석 중 오류가 발생했습니다: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // 분석 단계 상태 업데이트 함수
  const updateAnalysisStep = (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error', message?: string) => {
    setAnalysisSteps(steps => 
      steps.map(step => 
        step.id === stepId 
          ? { ...step, status, message } 
          : step
      )
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">쇼핑몰 스타일 분석</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <UrlInputForm 
            onAnalyze={handleAnalyze} 
            isAnalyzing={isAnalyzing} 
          />
          <AnalysisProgressIndicator
            steps={analysisSteps}
            currentStep={currentStep}
            isCompleted={isCompleted}
            error={analysisError}
            className="mt-6"
          />
        </div>

        <div className="lg:col-span-2">
          <StyleAnalysisVisualDashboard
            isLoading={isAnalyzing && !analysisResult}
            analysisResult={analysisResult}
            aiAnalysis={aiAnalysis}
          />
        </div>
      </div>
    </div>
  );
} 