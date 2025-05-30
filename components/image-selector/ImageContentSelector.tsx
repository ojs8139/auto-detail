/**
 * 이미지 내용 선택 컴포넌트
 * 이미지 내용 분석 결과를 기반으로 이미지를 선택하는 기능을 제공합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ImageContentAnalysis, ImageContentAnalysisOptions } from '@/lib/services/imageContentAnalysisService';
import ImageContentAnalysisDisplay from './ImageContentAnalysisDisplay';
import { Loader2, ImagePlus, FilterX, Check, ShoppingBag, Image as ImageIcon, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageContentSelectorProps {
  imageUrls: string[];
  onSelectImage?: (imageUrl: string, analysis: ImageContentAnalysis) => void;
  analysisOptions?: ImageContentAnalysisOptions;
  autoSelectBest?: boolean;
  showDetails?: boolean;
  className?: string;
}

/**
 * 이미지 내용 선택 컴포넌트
 */
const ImageContentSelector: React.FC<ImageContentSelectorProps> = ({
  imageUrls,
  onSelectImage,
  analysisOptions = {},
  autoSelectBest = true,
  showDetails = true,
  className = '',
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<ImageContentAnalysis[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  // 이미지 내용 분석 실행
  useEffect(() => {
    const analyzeImages = async () => {
      if (!imageUrls.length) {
        setError('분석할 이미지가 없습니다.');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setAnalysisResults([]);

        // API 호출
        const response = await fetch('/api/image-content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrls,
            options: analysisOptions,
          }),
        });

        if (!response.ok) {
          throw new Error('이미지 내용 분석 API 호출 실패');
        }

        const data = await response.json();
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new Error('유효한 응답이 없습니다.');
        }

        // 상업적 가치 기준 정렬
        const sortedResults = data.sort((a, b) => b.commercialValue.score - a.commercialValue.score);
        setAnalysisResults(sortedResults);

        // 자동 선택 옵션이 활성화되어 있다면 최적 이미지 선택
        if (autoSelectBest && sortedResults.length > 0) {
          // 1. 메인 섹션 이미지 중 상업적 가치가 가장 높은 이미지 찾기
          const mainImages = sortedResults.filter(analysis => analysis.recommendedUse.section === 'main');
          
          let bestImage: ImageContentAnalysis;
          
          if (mainImages.length > 0) {
            bestImage = mainImages[0]; // 이미 상업적 가치 순으로 정렬되어 있음
          } else {
            // 2. 제품 중심 이미지 중 상업적 가치가 가장 높은 이미지 찾기
            const productImages = sortedResults.filter(analysis => analysis.contentType.isProduct);
            
            if (productImages.length > 0) {
              bestImage = productImages[0];
            } else {
              // 3. 상업적 가치가 가장 높은 이미지 선택
              bestImage = sortedResults[0];
            }
          }
          
          setSelectedImageUrl(bestImage.imageUrl);
          
          if (onSelectImage) {
            onSelectImage(bestImage.imageUrl, bestImage);
          }
          
          toast({
            title: "최적 이미지 선택됨",
            variant: "default",
            children: (
              <p>{bestImage.contentType.isProduct ? '제품 중심 ' : ''}이미지가 선택되었습니다. (상업적 가치: {Math.round(bestImage.commercialValue.score * 100)}%)</p>
            )
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '이미지 내용 분석 중 오류가 발생했습니다.';
        setError(errorMessage);
        toast({
          title: "오류 발생",
          variant: "destructive",
          children: (
            <p>{errorMessage}</p>
          )
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (imageUrls.length > 0) {
      analyzeImages();
    }
  }, [imageUrls, analysisOptions, autoSelectBest, onSelectImage, toast]);

  // 이미지 선택 핸들러
  const handleSelectImage = (analysis: ImageContentAnalysis) => {
    setSelectedImageUrl(analysis.imageUrl);
    
    if (onSelectImage) {
      onSelectImage(analysis.imageUrl, analysis);
    }
    
    toast({
      title: "이미지 선택됨",
      variant: "default",
      children: (
        <p>이미지가 선택되었습니다. (상업적 가치: {Math.round(analysis.commercialValue.score * 100)}%)</p>
      )
    });
  };

  // 필터링된 이미지 결과 반환
  const getFilteredResults = () => {
    switch (activeTab) {
      case 'product':
        return analysisResults.filter(analysis => analysis.contentType.isProduct);
      case 'lifestyle':
        return analysisResults.filter(analysis => analysis.contentType.isLifestyle);
      case 'main':
        return analysisResults.filter(analysis => analysis.recommendedUse.section === 'main');
      case 'detail':
        return analysisResults.filter(analysis => analysis.recommendedUse.section === 'detail');
      default:
        return analysisResults;
    }
  };

  const filteredResults = getFilteredResults();

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">이미지 내용을 분석하고 있습니다...</p>
        <p className="text-gray-400 text-sm text-center mt-2">{imageUrls.length}개의 이미지를 분석 중입니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg ${className}`}>
        <FilterX className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-500 font-medium text-center">이미지 내용 분석 중 오류 발생</p>
        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
      </div>
    );
  }

  if (analysisResults.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">분석할 이미지가 없습니다.</p>
        <p className="text-gray-400 text-sm text-center mt-2">이미지 URL을 제공해주세요.</p>
      </div>
    );
  }

  // 탭에 표시할 항목 개수 계산
  const counts = {
    all: analysisResults.length,
    product: analysisResults.filter(a => a.contentType.isProduct).length,
    lifestyle: analysisResults.filter(a => a.contentType.isLifestyle).length,
    main: analysisResults.filter(a => a.recommendedUse.section === 'main').length,
    detail: analysisResults.filter(a => a.recommendedUse.section === 'detail').length
  };

  return (
    <div className={className}>
      <h3 className="text-lg font-medium mb-4">이미지 내용 분석 결과</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            <span>전체 ({counts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="product" className="flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" />
            <span>제품 ({counts.product})</span>
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>라이프스타일 ({counts.lifestyle})</span>
          </TabsTrigger>
          <TabsTrigger value="main" className="flex items-center gap-1.5">
            <span>메인 ({counts.main})</span>
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-1.5">
            <span>상세 ({counts.detail})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {filteredResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-center">해당 조건에 맞는 이미지가 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredResults.map((analysis) => (
            <div key={analysis.imageUrl} className="relative">
              <ImageContentAnalysisDisplay
                analysis={analysis}
                showDetails={showDetails}
                className={`
                  cursor-pointer transition-all duration-200 
                  ${selectedImageUrl === analysis.imageUrl 
                    ? 'ring-2 ring-blue-500 shadow-lg transform scale-[1.02]' 
                    : 'hover:shadow-md hover:transform hover:scale-[1.01]'}
                `}
                onClick={() => handleSelectImage(analysis)}
              />
              
              {selectedImageUrl === analysis.imageUrl && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageContentSelector; 