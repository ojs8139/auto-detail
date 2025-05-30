"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { ImageAnalysisData } from '@/lib/services/imageDiversityService';
import { PageSection, SectionMatchingResult } from '@/lib/services/imageSectionMatchingService';

// 섹션 정보 매핑
const SECTION_INFO: Record<PageSection, { label: string; description: string; icon?: string }> = {
  [PageSection.HERO]: { 
    label: '대표 이미지', 
    description: '상세페이지 상단에 위치하는 대표 이미지입니다.' 
  },
  [PageSection.FEATURES]: { 
    label: '제품 특징', 
    description: '제품의 주요 특징과 장점을 보여주는 이미지입니다.' 
  },
  [PageSection.DETAILS]: { 
    label: '상세 설명', 
    description: '제품의 세부 정보와 특징을 자세히 보여주는 이미지입니다.' 
  },
  [PageSection.USAGE]: { 
    label: '사용 방법', 
    description: '제품의 사용 방법과 활용 예시를 보여주는 이미지입니다.' 
  },
  [PageSection.SPECS]: { 
    label: '제품 사양', 
    description: '제품의 크기, 무게 등 스펙 정보를 보여주는 이미지입니다.' 
  },
  [PageSection.GALLERY]: { 
    label: '갤러리', 
    description: '제품의 다양한 모습을 보여주는 추가 이미지 모음입니다.' 
  },
  [PageSection.LIFESTYLE]: { 
    label: '라이프스타일', 
    description: '제품이 실생활에서 사용되는 모습을 보여주는 이미지입니다.' 
  },
  [PageSection.ACCESSORIES]: { 
    label: '액세서리', 
    description: '제품과 함께 사용할 수 있는 액세서리를 보여주는 이미지입니다.' 
  },
  [PageSection.COMPARISON]: { 
    label: '비교/대조', 
    description: '다른 제품이나 옵션과의 비교를 보여주는 이미지입니다.' 
  },
};

// 레이아웃 타입 정보
const LAYOUT_INFO: Record<string, { label: string; description: string }> = {
  'grid': { 
    label: '그리드', 
    description: '균일한 크기의 격자 형태로 이미지를 배치합니다.' 
  },
  'slider': { 
    label: '슬라이더', 
    description: '가로로 스크롤 가능한 형태로 이미지를 배치합니다.' 
  },
  'mosaic': { 
    label: '모자이크', 
    description: '다양한 크기의 이미지를 조합하여 모자이크 형태로 배치합니다.' 
  },
  'single': { 
    label: '단일', 
    description: '하나의 큰 이미지로 전체 영역을 채웁니다.' 
  },
  'comparison': { 
    label: '비교', 
    description: '두 이미지를 나란히 배치하여 비교할 수 있게 합니다.' 
  }
};

// 컴포넌트 props 정의
interface SectionMatchingViewProps {
  images: ImageAnalysisData[];
  onSectionMatchingComplete?: (result: SectionMatchingResult) => void;
  onSectionChange?: (section: PageSection, images: ImageAnalysisData[]) => void;
}

/**
 * 이미지 섹션 매칭 뷰 컴포넌트
 */
export default function SectionMatchingView({
  images,
  onSectionMatchingComplete,
  onSectionChange
}: SectionMatchingViewProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<PageSection>(PageSection.HERO);
  const [matchingResult, setMatchingResult] = useState<SectionMatchingResult | null>(null);
  const [layoutRecommendations, setLayoutRecommendations] = useState<Record<string, any>>({});
  
  // 섹션 매칭 실행
  const runSectionMatching = async () => {
    if (!images || images.length === 0) {
      toast({
        title: '이미지 없음',
        description: '섹션 매칭을 실행하기 위한 이미지가 없습니다.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/image-section-matching', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images,
          options: {
            // 기본 옵션 사용
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('섹션 매칭 API 호출 실패');
      }
      
      const data = await response.json();
      
      // 결과 저장
      setMatchingResult(data.matchingResult);
      setLayoutRecommendations(data.layoutRecommendations);
      
      // 첫 번째 섹션으로 활성 탭 설정
      const firstSection = Object.keys(data.matchingResult)[0] as PageSection;
      if (firstSection) {
        setActiveTab(firstSection);
      }
      
      // 상위 컴포넌트에 결과 전달
      if (onSectionMatchingComplete) {
        onSectionMatchingComplete(data.matchingResult);
      }
      
      toast({
        title: '섹션 매칭 완료',
        description: '이미지가 각 섹션에 성공적으로 매칭되었습니다.'
      });
      
    } catch (error) {
      console.error('섹션 매칭 오류:', error);
      toast({
        title: '섹션 매칭 오류',
        description: '이미지 섹션 매칭 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 탭 변경 핸들러
  const handleTabChange = (section: PageSection) => {
    setActiveTab(section);
    
    // 상위 컴포넌트에 변경된 섹션 정보 전달
    if (onSectionChange && matchingResult && matchingResult[section]) {
      onSectionChange(section, matchingResult[section] || []);
    }
  };
  
  // 이미지 추가/제거 핸들러
  const handleImageToggle = (section: PageSection, image: ImageAnalysisData) => {
    if (!matchingResult) return;
    
    const newResult = { ...matchingResult };
    
    // 이미지가 이미 섹션에 있는지 확인
    const sectionImages = newResult[section] || [];
    const imageIndex = sectionImages.findIndex(img => img.imageUrl === image.imageUrl);
    
    if (imageIndex >= 0) {
      // 이미지 제거
      sectionImages.splice(imageIndex, 1);
    } else {
      // 이미지 추가
      sectionImages.push(image);
    }
    
    newResult[section] = sectionImages;
    setMatchingResult(newResult);
    
    // 상위 컴포넌트에 변경 알림
    if (onSectionChange) {
      onSectionChange(section, sectionImages);
    }
  };
  
  // 모든 이미지 목록 렌더링
  const renderAllImages = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {images.map((image, index) => (
          <div
            key={`all-${index}-${image.imageUrl}`}
            className="relative group cursor-pointer rounded-md overflow-hidden"
            onClick={() => handleImageToggle(activeTab, image)}
          >
            <img
              src={image.imageUrl}
              alt={`이미지 ${index + 1}`}
              className="w-full h-24 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-white text-sm">이 섹션에 추가</span>
            </div>
            
            {/* 이미 현재 섹션에 있는 이미지 표시 */}
            {matchingResult && matchingResult[activeTab]?.some(img => img.imageUrl === image.imageUrl) && (
              <div className="absolute top-1 right-1">
                <Badge variant="default">선택됨</Badge>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // 섹션별 이미지 렌더링
  const renderSectionImages = (section: PageSection) => {
    if (!matchingResult || !matchingResult[section] || matchingResult[section]?.length === 0) {
      return (
        <div className="p-8 text-center text-muted-foreground">
          이 섹션에 매칭된 이미지가 없습니다.
        </div>
      );
    }
    
    const sectionImages = matchingResult[section] || [];
    const layout = layoutRecommendations[section]?.layout || 'grid';
    const columns = layoutRecommendations[section]?.columns || 3;
    
    return (
      <div className={`grid grid-cols-${Math.min(columns, sectionImages.length)} gap-3`}>
        {sectionImages.map((image, index) => (
          <div
            key={`section-${section}-${index}-${image.imageUrl}`}
            className="relative group cursor-pointer rounded-md overflow-hidden"
          >
            <img
              src={image.imageUrl}
              alt={`${SECTION_INFO[section]?.label} 이미지 ${index + 1}`}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Button
                variant="outline"
                size="sm"
                className="bg-background"
                onClick={() => handleImageToggle(section, image)}
              >
                제거
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // 레이아웃 정보 렌더링
  const renderLayoutInfo = (section: PageSection) => {
    if (!layoutRecommendations[section]) return null;
    
    const layout = layoutRecommendations[section].layout;
    const columns = layoutRecommendations[section].columns;
    
    return (
      <div className="mt-2 flex items-center text-sm text-muted-foreground">
        <span className="font-medium mr-2">추천 레이아웃:</span>
        <Badge variant="outline" className="mr-1">
          {LAYOUT_INFO[layout]?.label || layout}
        </Badge>
        {columns && (
          <Badge variant="outline">
            {columns}열
          </Badge>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">섹션별 이미지 매칭</h3>
        <Button
          onClick={runSectionMatching}
          disabled={isLoading || !images || images.length === 0}
        >
          {isLoading ? '처리 중...' : '자동 매칭 실행'}
        </Button>
      </div>
      
      {matchingResult ? (
        <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as PageSection)}>
          <TabsList className="mb-4 flex flex-wrap h-auto">
            {Object.entries(SECTION_INFO).map(([section, info]) => (
              // 해당 섹션에 이미지가 있는 경우에만 탭 표시
              matchingResult[section as PageSection]?.length ? (
                <TabsTrigger
                  key={section}
                  value={section as PageSection}
                  className="px-3 py-1.5 m-1"
                >
                  {info.label}
                  <Badge variant="secondary" className="ml-2">
                    {matchingResult[section as PageSection]?.length || 0}
                  </Badge>
                </TabsTrigger>
              ) : null
            ))}
          </TabsList>
          
          {Object.values(PageSection).map((section) => (
            <TabsContent key={section} value={section}>
              <Card>
                <CardHeader>
                  <CardTitle>{SECTION_INFO[section]?.label}</CardTitle>
                  <CardDescription>{SECTION_INFO[section]?.description}</CardDescription>
                  {renderLayoutInfo(section)}
                </CardHeader>
                <CardContent>
                  {renderSectionImages(section)}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">모든 이미지</h4>
            <p className="text-sm text-muted-foreground mb-4">
              이미지를 클릭하여 현재 선택된 섹션에 추가하거나 제거할 수 있습니다.
            </p>
            {renderAllImages()}
          </div>
        </Tabs>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            자동 매칭 실행 버튼을 클릭하여 이미지를 섹션별로 매칭해보세요.
          </p>
        </div>
      )}
    </div>
  );
} 