"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { ImageAnalysisData } from '@/lib/services/imageDiversityService';
import { PageSection } from '@/lib/services/imageSectionMatchingService';
import { FeedbackType } from '@/lib/services/userFeedbackService';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import SectionMatchingView from '@/components/image-selector/SectionMatchingView';

// 컴포넌트 props 정의
interface ManualAdjustmentInterfaceProps {
  projectId: string;
  userId?: string;
  images: ImageAnalysisData[];
  initialSelectedImages?: ImageAnalysisData[];
  onSelectionChange?: (images: ImageAnalysisData[]) => void;
  onSubmit?: (selectedImages: ImageAnalysisData[], feedbackProvided: boolean) => void;
}

/**
 * 이미지 수동 조정 및 피드백 인터페이스 컴포넌트
 */
export default function ManualAdjustmentInterface({
  projectId,
  userId,
  images,
  initialSelectedImages = [],
  onSelectionChange,
  onSubmit
}: ManualAdjustmentInterfaceProps) {
  // 선택된 이미지 목록 상태
  const [selectedImages, setSelectedImages] = useState<ImageAnalysisData[]>(initialSelectedImages);
  const [activeTab, setActiveTab] = useState<string>('images');
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackProvided, setFeedbackProvided] = useState(false);
  
  // 필터 옵션 상태
  const [filterOptions, setFilterOptions] = useState({
    minQualityScore: 0,
    showHighQualityOnly: false,
    preferDiversity: false,
  });
  
  // 이미지 선택/해제 처리
  const toggleImageSelection = (image: ImageAnalysisData) => {
    const isSelected = selectedImages.some(img => img.imageUrl === image.imageUrl);
    
    let newSelectedImages: ImageAnalysisData[];
    
    if (isSelected) {
      // 이미지 선택 해제
      newSelectedImages = selectedImages.filter(img => img.imageUrl !== image.imageUrl);
    } else {
      // 이미지 선택 추가
      newSelectedImages = [...selectedImages, image];
    }
    
    setSelectedImages(newSelectedImages);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedImages);
    }
  };
  
  // 이미지 품질 점수 기준 필터링
  const getFilteredImages = () => {
    return images.filter(image => {
      // 품질 점수 필터
      if (filterOptions.minQualityScore > 0 && image.quality) {
        const qualityScore = image.quality.overall.score || 0;
        if (qualityScore < filterOptions.minQualityScore / 10) {
          return false;
        }
      }
      
      // 고품질 이미지만 표시 필터
      if (filterOptions.showHighQualityOnly && image.quality) {
        const qualityScore = image.quality.overall.score || 0;
        if (qualityScore < 0.7) { // 70% 이상 품질만 표시
          return false;
        }
      }
      
      return true;
    });
  };
  
  // 이미지 정렬 함수
  const getSortedImages = (imagesToSort: ImageAnalysisData[]) => {
    if (filterOptions.preferDiversity) {
      // 다양성 점수로 정렬 (높은 순)
      return [...imagesToSort].sort((a, b) => 
        (b.diversityScore || 0) - (a.diversityScore || 0)
      );
    }
    
    // 기본: 품질 점수로 정렬 (높은 순)
    return [...imagesToSort].sort((a, b) => 
      ((b.quality?.overall?.score || 0) - (a.quality?.overall?.score || 0))
    );
  };
  
  // 섹션별 이미지 변경 처리
  const handleSectionChange = (section: PageSection, sectionImages: ImageAnalysisData[]) => {
    setSelectedSection(section);
    
    // 선택된 이미지 추가/업데이트
    const currentSelectedImages = selectedImages.filter(img => 
      !sectionImages.some(sectionImg => sectionImg.imageUrl === img.imageUrl)
    );
    
    const newSelectedImages = [...currentSelectedImages, ...sectionImages];
    setSelectedImages(newSelectedImages);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedImages);
    }
  };
  
  // 피드백 제출 처리
  const handleFeedbackSubmit = (success: boolean) => {
    if (success) {
      setFeedbackProvided(true);
      setShowFeedbackForm(false);
      
      toast({
        title: '피드백이 제출되었습니다',
        description: '소중한 의견을 보내주셔서 감사합니다.',
      });
    }
  };
  
  // 최종 제출 처리
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(selectedImages, feedbackProvided);
    }
    
    toast({
      title: '이미지 선택 완료',
      description: `${selectedImages.length}개의 이미지가 선택되었습니다.`,
    });
  };
  
  const filteredImages = getFilteredImages();
  const sortedImages = getSortedImages(filteredImages);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">이미지 수동 조정</h2>
        <p className="text-muted-foreground">
          자동으로 선택된 이미지를 검토하고 필요에 따라 수동으로 조정하세요.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">
            이미지 선택
            <Badge variant="secondary" className="ml-2">
              {sortedImages.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sections">
            섹션별 배치
          </TabsTrigger>
          <TabsTrigger value="feedback">
            피드백
            {feedbackProvided && (
              <Badge variant="default" className="ml-2">
                완료
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* 이미지 선택 탭 */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>이미지 선택</CardTitle>
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 품질 점수 필터 */}
                  <div className="space-y-2">
                    <Label htmlFor="quality-threshold">
                      최소 품질 점수: {filterOptions.minQualityScore}/10
                    </Label>
                    <Slider
                      id="quality-threshold"
                      min={0}
                      max={10}
                      step={1}
                      value={[filterOptions.minQualityScore]}
                      onValueChange={(value) => 
                        setFilterOptions({...filterOptions, minQualityScore: value[0]})
                      }
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-4">
                    {/* 고품질 이미지만 표시 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="high-quality-only"
                        checked={filterOptions.showHighQualityOnly}
                        onCheckedChange={(checked) => 
                          setFilterOptions({...filterOptions, showHighQualityOnly: checked})
                        }
                      />
                      <Label htmlFor="high-quality-only">
                        고품질 이미지만 표시
                      </Label>
                    </div>
                    
                    {/* 다양성 우선 정렬 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="prefer-diversity"
                        checked={filterOptions.preferDiversity}
                        onCheckedChange={(checked) => 
                          setFilterOptions({...filterOptions, preferDiversity: checked})
                        }
                      />
                      <Label htmlFor="prefer-diversity">
                        다양성 기준 정렬
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sortedImages.map((image, index) => {
                  const isSelected = selectedImages.some(img => img.imageUrl === image.imageUrl);
                  
                  return (
                    <div
                      key={index}
                      className={`relative group cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                        isSelected ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => toggleImageSelection(image)}
                    >
                      <img
                        src={image.imageUrl}
                        alt={`이미지 ${index + 1}`}
                        className="w-full h-40 object-cover"
                      />
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Button
                          variant={isSelected ? "destructive" : "secondary"}
                          size="sm"
                        >
                          {isSelected ? '선택 해제' : '선택'}
                        </Button>
                      </div>
                      
                      {/* 이미지 정보 뱃지 */}
                      <div className="absolute top-2 right-2 flex flex-col space-y-1">
                        {/* 품질 점수 표시 */}
                        {image.quality?.overall?.score && (
                          <Badge variant="outline" className="bg-white/80">
                            품질: {Math.round(image.quality.overall.score * 100)}%
                          </Badge>
                        )}
                        {image.diversityScore && (
                          <Badge variant="outline" className="bg-white/80">
                            다양성: {Math.round(image.diversityScore * 100)}%
                          </Badge>
                        )}
                      </div>
                      
                      {/* 선택 표시 */}
                      {isSelected && (
                        <div className="absolute top-2 left-2">
                          <Badge>선택됨</Badge>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {sortedImages.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  필터 조건에 맞는 이미지가 없습니다. 필터 설정을 조정해보세요.
                </div>
              )}
            </CardContent>
            
            <CardFooter>
              <div className="flex flex-col w-full space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm">
                    {selectedImages.length}개 이미지 선택됨
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImages([])}
                    disabled={selectedImages.length === 0}
                  >
                    선택 초기화
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* 섹션별 배치 탭 */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>섹션별 이미지 배치</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionMatchingView 
                images={images} 
                onSectionChange={handleSectionChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* 피드백 탭 */}
        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>알고리즘 피드백</CardTitle>
            </CardHeader>
            <CardContent>
              {showFeedbackForm ? (
                <FeedbackForm
                  projectId={projectId}
                  userId={userId}
                  selectedImages={selectedImages.map(img => img.imageUrl)}
                  initialType={selectedSection ? FeedbackType.SECTION_MATCH : FeedbackType.GENERAL}
                  initialSection={selectedSection || undefined}
                  onFeedbackSubmit={handleFeedbackSubmit}
                />
              ) : (
                <div className="py-8 text-center space-y-4">
                  {feedbackProvided ? (
                    <>
                      <p>피드백이 성공적으로 제출되었습니다.</p>
                      <Button onClick={() => setShowFeedbackForm(true)}>
                        추가 피드백 제공
                      </Button>
                    </>
                  ) : (
                    <>
                      <p>이미지 선택 알고리즘에 대한 피드백을 제공해주세요.</p>
                      <p className="text-sm text-muted-foreground">
                        여러분의 소중한 의견은 알고리즘 개선에 큰 도움이 됩니다.
                      </p>
                      <Button onClick={() => setShowFeedbackForm(true)}>
                        피드백 작성하기
                      </Button>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={() => setActiveTab('images')}>
          이전 단계
        </Button>
        <Button onClick={handleSubmit} disabled={selectedImages.length === 0}>
          선택 완료
        </Button>
      </div>
    </div>
  );
} 