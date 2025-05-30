/**
 * 이미지 자동 선택 컴포넌트
 * 품질 기준에 따라 이미지를 자동으로 선택하는 기능을 제공합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ImageQualityAssessment, ImageQualityOptions } from '@/lib/services/imageQualityService';
import ImageQualityAssessmentDisplay from './ImageQualityAssessmentDisplay';
import { Loader2, ImagePlus, FilterX, Check } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ImageQualitySelectorProps {
  imageUrls: string[];
  onSelectImage?: (imageUrl: string, qualityAssessment: ImageQualityAssessment) => void;
  qualityOptions?: ImageQualityOptions;
  autoSelectBest?: boolean;
  showDetails?: boolean;
  className?: string;
}

/**
 * 이미지 자동 선택 컴포넌트
 */
const ImageQualitySelector: React.FC<ImageQualitySelectorProps> = ({
  imageUrls,
  onSelectImage,
  qualityOptions = {},
  autoSelectBest = true,
  showDetails = true,
  className = '',
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [qualityAssessments, setQualityAssessments] = useState<ImageQualityAssessment[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 이미지 품질 평가 실행
  useEffect(() => {
    const assessImages = async () => {
      if (!imageUrls.length) {
        setError('평가할 이미지가 없습니다.');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setQualityAssessments([]);

        // API 호출
        const response = await fetch('/api/image-quality', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrls,
            options: qualityOptions,
          }),
        });

        if (!response.ok) {
          throw new Error('이미지 품질 평가 API 호출 실패');
        }

        const data = await response.json();
        
        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new Error('유효한 응답이 없습니다.');
        }

        // 품질 점수 기준 정렬
        const sortedAssessments = data.sort((a, b) => b.overall.score - a.overall.score);
        setQualityAssessments(sortedAssessments);

        // 자동 선택 옵션이 활성화되어 있다면 최고 품질 이미지 선택
        if (autoSelectBest && sortedAssessments.length > 0) {
          const bestImage = sortedAssessments[0];
          setSelectedImageUrl(bestImage.imageUrl);
          
          if (onSelectImage) {
            onSelectImage(bestImage.imageUrl, bestImage);
          }
          
          toast({
            title: "최적 이미지 선택됨",
            variant: "default",
            children: (
              <p>품질 점수 {Math.round(bestImage.overall.score * 100)}%의 이미지가 선택되었습니다.</p>
            )
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '이미지 품질 평가 중 오류가 발생했습니다.';
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
      assessImages();
    }
  }, [imageUrls, qualityOptions, autoSelectBest, onSelectImage, toast]);

  // 이미지 선택 핸들러
  const handleSelectImage = (assessment: ImageQualityAssessment) => {
    setSelectedImageUrl(assessment.imageUrl);
    
    if (onSelectImage) {
      onSelectImage(assessment.imageUrl, assessment);
    }
    
    toast({
      title: "이미지 선택됨",
      variant: "default",
      children: (
        <p>품질 점수 {Math.round(assessment.overall.score * 100)}%의 이미지가 선택되었습니다.</p>
      )
    });
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">이미지 품질을 분석하고 있습니다...</p>
        <p className="text-gray-400 text-sm text-center mt-2">{imageUrls.length}개의 이미지를 평가 중입니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg ${className}`}>
        <FilterX className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-500 font-medium text-center">이미지 품질 평가 중 오류 발생</p>
        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
      </div>
    );
  }

  if (qualityAssessments.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">평가할 이미지가 없습니다.</p>
        <p className="text-gray-400 text-sm text-center mt-2">이미지 URL을 제공해주세요.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-medium mb-4">이미지 품질 평가 결과</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {qualityAssessments.map((assessment) => (
          <div key={assessment.imageUrl} className="relative">
            <ImageQualityAssessmentDisplay
              assessment={assessment}
              showDetails={showDetails}
              className={`
                cursor-pointer transition-all duration-200 
                ${selectedImageUrl === assessment.imageUrl 
                  ? 'ring-2 ring-blue-500 shadow-lg transform scale-[1.02]' 
                  : 'hover:shadow-md hover:transform hover:scale-[1.01]'}
              `}
              onClick={() => handleSelectImage(assessment)}
            />
            
            {selectedImageUrl === assessment.imageUrl && (
              <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1">
                <Check className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageQualitySelector; 