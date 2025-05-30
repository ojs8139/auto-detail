/**
 * 이미지 다양성 선택 컴포넌트
 * 이미지 다양성 분석 결과를 기반으로 최적의 이미지 세트를 선택하는 기능을 제공합니다.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ImageAnalysisData, 
  DiversityOptions 
} from '@/lib/services/imageDiversityService';
import ImageDiversityDisplay from './ImageDiversityDisplay';
import { Loader2, ImagePlus, FilterX, CheckCircle2, Grid, Group, ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { 
  ImageContentAnalysis 
} from '@/lib/services/imageContentAnalysisService';
import { 
  ImageQualityAssessment 
} from '@/lib/services/imageQualityService';

interface ImageDiversitySelectorProps {
  images: {
    imageUrl: string;
    quality?: ImageQualityAssessment;
    content?: ImageContentAnalysis;
  }[];
  onSelectImages?: (images: ImageAnalysisData[]) => void;
  diversityOptions?: DiversityOptions;
  autoSelectBest?: boolean;
  className?: string;
}

/**
 * 이미지 다양성 선택 컴포넌트
 */
const ImageDiversitySelector: React.FC<ImageDiversitySelectorProps> = ({
  images,
  onSelectImages,
  diversityOptions = {},
  autoSelectBest = true,
  className = '',
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [diversityResults, setDiversityResults] = useState<{
    images: ImageAnalysisData[];
    similarityGroups: string[][];
    recommendations: {
      diverse: ImageAnalysisData[];
      byCategory: Record<string, ImageAnalysisData[]>;
    };
  } | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageAnalysisData[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 이미지 다양성 분석 실행
  useEffect(() => {
    const analyzeDiversity = async () => {
      if (!images.length) {
        setError('분석할 이미지가 없습니다.');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setDiversityResults(null);

        // API 호출
        const response = await fetch('/api/image-diversity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images,
            options: diversityOptions,
          }),
        });

        if (!response.ok) {
          throw new Error('이미지 다양성 분석 API 호출 실패');
        }

        const data = await response.json();
        
        if (!data || !data.analysis || !data.recommendations) {
          throw new Error('유효한 응답이 없습니다.');
        }

        setDiversityResults({
          images: data.analysis.images,
          similarityGroups: data.analysis.similarityGroups,
          recommendations: data.analysis.recommendations
        });

        // 자동 선택 옵션이 활성화되어 있다면 추천 이미지 선택
        if (autoSelectBest && data.recommendations) {
          const recommendedImages = data.recommendations.allImages || 
            data.recommendations.mainImages.concat(
              data.recommendations.detailImages,
              data.recommendations.lifestyleImages
            );
          
          setSelectedImages(recommendedImages);
          
          if (onSelectImages) {
            onSelectImages(recommendedImages);
          }
          
          toast({
            title: "최적 이미지 세트 선택됨",
            variant: "default",
            children: (
              <p>{recommendedImages.length}개의 다양한 이미지가 선택되었습니다.</p>
            )
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '이미지 다양성 분석 중 오류가 발생했습니다.';
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

    if (images.length > 0) {
      analyzeDiversity();
    }
  }, [images, diversityOptions, autoSelectBest, onSelectImages, toast]);

  // 이미지 선택 핸들러
  const handleSelectImage = (image: ImageAnalysisData) => {
    // 이미 선택된 이미지인지 확인
    const isAlreadySelected = selectedImages.some(img => img.imageUrl === image.imageUrl);
    
    let newSelectedImages: ImageAnalysisData[];
    
    if (isAlreadySelected) {
      // 이미 선택된 이미지라면 제거
      newSelectedImages = selectedImages.filter(img => img.imageUrl !== image.imageUrl);
    } else {
      // 선택되지 않은 이미지라면 추가
      newSelectedImages = [...selectedImages, image];
    }
    
    setSelectedImages(newSelectedImages);
    
    if (onSelectImages) {
      onSelectImages(newSelectedImages);
    }
    
    toast({
      title: isAlreadySelected ? "이미지 선택 해제됨" : "이미지 선택됨",
      variant: "default",
      children: (
        <p>{isAlreadySelected 
          ? "이미지가 선택 해제되었습니다." 
          : "이미지가 선택되었습니다."}</p>
      )
    });
  };

  // 추천 세트 선택 핸들러
  const handleSelectRecommendedSet = () => {
    if (!diversityResults || !diversityResults.recommendations) return;
    
    const recommendedImages = diversityResults.recommendations.diverse;
    
    setSelectedImages(recommendedImages);
    
    if (onSelectImages) {
      onSelectImages(recommendedImages);
    }
    
    toast({
      title: "추천 이미지 세트 선택됨",
      variant: "default",
      children: (
        <p>{recommendedImages.length}개의 다양한 이미지가 선택되었습니다.</p>
      )
    });
  };
  
  // 카테고리별 추천 이미지 선택 핸들러
  const handleSelectCategorySet = (category: 'main' | 'detail' | 'lifestyle') => {
    if (!diversityResults || !diversityResults.recommendations) return;
    
    const categoryImages = diversityResults.recommendations.byCategory[category] || [];
    
    if (categoryImages.length === 0) {
      toast({
        title: "이미지 없음",
        variant: "destructive",
        children: (
          <p>해당 카테고리에 추천할 이미지가 없습니다.</p>
        )
      });
      return;
    }
    
    setSelectedImages(categoryImages);
    
    if (onSelectImages) {
      onSelectImages(categoryImages);
    }
    
    toast({
      title: `${
        category === 'main' ? '메인' : 
        category === 'detail' ? '상세' : 
        '라이프스타일'
      } 이미지 선택됨`,
      variant: "default",
      children: (
        <p>{categoryImages.length}개의 이미지가 선택되었습니다.</p>
      )
    });
  };

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">이미지 다양성을 분석하고 있습니다...</p>
        <p className="text-gray-400 text-sm text-center mt-2">{images.length}개의 이미지를 분석 중입니다.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg ${className}`}>
        <FilterX className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-500 font-medium text-center">이미지 다양성 분석 중 오류 발생</p>
        <p className="text-red-400 text-sm text-center mt-2">{error}</p>
      </div>
    );
  }

  if (!diversityResults) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 text-center">분석할 이미지가 없습니다.</p>
        <p className="text-gray-400 text-sm text-center mt-2">이미지를 제공해주세요.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">이미지 다양성 분석 결과</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-1.5"
            onClick={handleSelectRecommendedSet}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>다양한 세트 선택</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-1.5"
            onClick={() => handleSelectCategorySet('main')}
          >
            <ImageIcon className="h-4 w-4" />
            <span>메인 이미지</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-1.5"
            onClick={() => handleSelectCategorySet('detail')}
          >
            <Grid className="h-4 w-4" />
            <span>상세 이미지</span>
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-1.5"
            onClick={() => handleSelectCategorySet('lifestyle')}
          >
            <Group className="h-4 w-4" />
            <span>라이프스타일</span>
          </Button>
        </div>
      </div>
      
      <ImageDiversityDisplay
        images={diversityResults.images}
        similarityGroups={diversityResults.similarityGroups}
        recommendations={diversityResults.recommendations}
        onSelectImage={handleSelectImage}
      />
      
      {selectedImages.length > 0 && (
        <div className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <h4 className="text-sm font-medium mb-3">선택된 이미지 ({selectedImages.length}개)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {selectedImages.map((image) => (
              <div key={image.imageUrl} className="relative">
                <div className="h-20 bg-white rounded-md overflow-hidden border">
                  <img 
                    src={image.imageUrl} 
                    alt="Selected image"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-5 w-5 absolute -top-2 -right-2 rounded-full p-0"
                  onClick={() => handleSelectImage(image)}
                >
                  <FilterX className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDiversitySelector; 