/**
 * 이미지 다양성 시각화 컴포넌트
 * 이미지 다양성 분석 결과를 시각적으로 표시합니다.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ImageAnalysisData } from '@/lib/services/imageDiversityService';
import { GridIcon, ListIcon, CheckCircle2, Fingerprint, Grid3X3, Sparkles } from 'lucide-react';

interface ImageDiversityDisplayProps {
  images: ImageAnalysisData[];
  similarityGroups: string[][];
  recommendations: {
    diverse: ImageAnalysisData[];
    byCategory: Record<string, ImageAnalysisData[]>;
  };
  onSelectImage?: (image: ImageAnalysisData) => void;
  className?: string;
}

/**
 * 이미지 다양성 표시 컴포넌트
 */
const ImageDiversityDisplay: React.FC<ImageDiversityDisplayProps> = ({
  images,
  similarityGroups,
  recommendations,
  onSelectImage,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('recommended');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  
  // 이미지 선택 핸들러
  const handleSelectImage = (image: ImageAnalysisData) => {
    setSelectedImageUrl(image.imageUrl);
    if (onSelectImage) {
      onSelectImage(image);
    }
  };
  
  // 이미지 그룹 강조 토글
  const handleHighlightGroup = (groupKey: string) => {
    setSelectedGroup(selectedGroup === groupKey ? null : groupKey);
  };
  
  // 이미지가 선택된 그룹에 속하는지 확인
  const isInSelectedGroup = (imageUrl: string): boolean => {
    if (!selectedGroup) return false;
    
    const groupList = selectedGroup.split(',');
    return groupList.includes(imageUrl);
  };
  
  // 이미지 카드 컴포넌트
  const ImageCard = ({ image }: { image: ImageAnalysisData }) => {
    const isSelected = selectedImageUrl === image.imageUrl;
    const isHighlighted = isInSelectedGroup(image.imageUrl);
    
    return (
      <div 
        className={`
          relative overflow-hidden rounded-md transition-all duration-200 cursor-pointer
          ${isSelected ? 'ring-2 ring-primary shadow-lg' : ''}
          ${isHighlighted ? 'ring-2 ring-indigo-400' : ''}
          ${isSelected && isHighlighted ? 'ring-2 ring-primary' : ''}
          hover:shadow-md
        `}
        onClick={() => handleSelectImage(image)}
      >
        <div className="h-36 bg-gray-100 relative">
          <img 
            src={image.imageUrl} 
            alt="Image preview"
            className="w-full h-full object-contain"
          />
          {isSelected && (
            <div className="absolute -top-1 -right-1 p-1 bg-primary rounded-full text-white">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {image.content && (
              <Badge 
                variant={image.content.contentType.isProduct ? "default" : "secondary"}
                className="text-xs"
              >
                {image.content.contentType.isProduct ? '제품' : 
                  image.content.contentType.isLifestyle ? '라이프스타일' : 
                  image.content.contentType.isInfographic ? '인포그래픽' : 
                  image.content.contentType.isPerson ? '인물' : '기타'}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-2 right-2">
            {image.content && (
              <Badge 
                variant="outline"
                className="bg-white/90 text-xs"
              >
                {image.content.recommendedUse.section === 'main' ? '메인' : 
                  image.content.recommendedUse.section === 'detail' ? '상세' : 
                  image.content.recommendedUse.section === 'lifestyle' ? '라이프스타일' : 
                  image.content.recommendedUse.section === 'specification' ? '스펙' : '기타'}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-2 text-xs">
          <div className="flex justify-between items-center">
            <div className="font-medium truncate">
              {image.imageUrl.split('/').pop()?.substring(0, 15) || 'Image'}
            </div>
            <div className="text-muted-foreground">
              {image.diversityScore !== undefined ? `${Math.round(image.diversityScore * 100)}%` : ''}
            </div>
          </div>
          {image.similarityGroups && image.similarityGroups.length > 0 && (
            <div className="mt-1 flex gap-1">
              {image.similarityGroups.map((group, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="icon"
                  className="h-4 w-4 p-0"
                  title="이미지 그룹 강조"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleHighlightGroup(group);
                  }}
                >
                  <Fingerprint className="h-3 w-3" />
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // 추천 이미지 목록 컴포넌트
  const RecommendedImages = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">다양한 이미지 추천</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {recommendations.diverse.map((image, index) => (
          <ImageCard key={`diverse-${index}`} image={image} />
        ))}
      </div>
      
      <h3 className="text-sm font-medium mt-6">메인 이미지 추천</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
        {recommendations.byCategory.main.slice(0, 3).map((image, index) => (
          <ImageCard key={`main-${index}`} image={image} />
        ))}
      </div>
      
      <h3 className="text-sm font-medium mt-6">상세 이미지 추천</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {recommendations.byCategory.detail.slice(0, 5).map((image, index) => (
          <ImageCard key={`detail-${index}`} image={image} />
        ))}
      </div>
      
      {recommendations.byCategory.lifestyle.length > 0 && (
        <>
          <h3 className="text-sm font-medium mt-6">라이프스타일 이미지 추천</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
            {recommendations.byCategory.lifestyle.slice(0, 3).map((image, index) => (
              <ImageCard key={`lifestyle-${index}`} image={image} />
            ))}
          </div>
        </>
      )}
    </div>
  );
  
  // 유사 그룹 목록 컴포넌트
  const SimilarityGroups = () => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        유사한 이미지들이 그룹화되어 있습니다. 그룹에서 가장 품질이 좋은 이미지를 선택하세요.
      </div>
      
      {similarityGroups.map((group, groupIndex) => (
        <Card key={`group-${groupIndex}`} className={
          selectedGroup === group.join(',') ? 'border-indigo-400' : ''
        }>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Fingerprint className="h-4 w-4 mr-2" />
              유사 이미지 그룹 {groupIndex + 1}
              <span className="ml-auto text-xs text-muted-foreground">
                {group.length}개 이미지
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-2"
                onClick={() => handleHighlightGroup(group.join(','))}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
            </CardTitle>
            <CardDescription className="text-xs">
              {group.length > 1 
                ? '이 그룹에서는 한 개의 이미지만 선택하는 것이 좋습니다.' 
                : '이 이미지는 다른 이미지와 유사하지 않습니다.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {group.map((imageUrl) => {
                const imageData = images.find(img => img.imageUrl === imageUrl);
                if (!imageData) return null;
                
                return <ImageCard key={imageUrl} image={imageData} />;
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  // 모든 이미지 목록 컴포넌트
  const AllImages = () => (
    <div className="space-y-4">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {images.map((image, index) => (
            <ImageCard key={`all-${index}`} image={image} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {images.map((image, index) => (
            <div
              key={`all-list-${index}`}
              className={`
                flex items-center p-2 rounded-md cursor-pointer
                ${selectedImageUrl === image.imageUrl ? 'bg-primary/10' : 'hover:bg-muted'}
                ${isInSelectedGroup(image.imageUrl) ? 'bg-indigo-50' : ''}
              `}
              onClick={() => handleSelectImage(image)}
            >
              <div className="h-16 w-16 bg-gray-100 mr-3 rounded-md overflow-hidden">
                <img 
                  src={image.imageUrl} 
                  alt="Image thumbnail"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <div className="font-medium truncate">
                    {image.imageUrl.split('/').pop() || 'Image'}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {image.diversityScore !== undefined ? `다양성: ${Math.round(image.diversityScore * 100)}%` : ''}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {image.content && (
                    <>
                      <Badge 
                        variant={image.content.contentType.isProduct ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {image.content.contentType.isProduct ? '제품' : 
                          image.content.contentType.isLifestyle ? '라이프스타일' : 
                          image.content.contentType.isInfographic ? '인포그래픽' : 
                          image.content.contentType.isPerson ? '인물' : '기타'}
                      </Badge>
                      <Badge 
                        variant="outline"
                        className="text-xs"
                      >
                        {image.content.recommendedUse.section === 'main' ? '메인' : 
                          image.content.recommendedUse.section === 'detail' ? '상세' : 
                          image.content.recommendedUse.section === 'lifestyle' ? '라이프스타일' : 
                          image.content.recommendedUse.section === 'specification' ? '스펙' : '기타'}
                      </Badge>
                    </>
                  )}
                  {image.similarityGroups && image.similarityGroups.length > 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-5 w-5 p-0"
                      title="이미지 그룹 강조"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleHighlightGroup(image.similarityGroups![0]);
                      }}
                    >
                      <Fingerprint className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">이미지 다양성 분석 결과</h2>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="recommended" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="recommended" className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" />
            <span>추천 이미지</span>
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-1.5">
            <GridIcon className="h-4 w-4" />
            <span>유사 그룹 ({similarityGroups.length})</span>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-1.5">
            <span>전체 이미지 ({images.length})</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommended">
          <RecommendedImages />
        </TabsContent>
        
        <TabsContent value="groups">
          <SimilarityGroups />
        </TabsContent>
        
        <TabsContent value="all">
          <AllImages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImageDiversityDisplay; 