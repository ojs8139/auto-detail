/**
 * 이미지 다양성 분석 페이지
 * 이미지 다양성을 분석하고 중복을 제거하여 최적의 이미지 세트를 추천합니다.
 */

'use client';

import React, { useState } from 'react';
import { 
  ImageAnalysisData,
  DiversityOptions 
} from '@/lib/services/imageDiversityService';
import { 
  ImageContentAnalysis 
} from '@/lib/services/imageContentAnalysisService';
import { 
  ImageQualityAssessment 
} from '@/lib/services/imageQualityService';
import ImageDiversitySelector from '@/components/image-selector/ImageDiversitySelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  ImageIcon, 
  Plus, 
  Trash2, 
  Settings, 
  ListFilter, 
  FileImage, 
  Copy 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

/**
 * 이미지 다양성 분석 페이지 컴포넌트
 */
export default function ImageDiversityPage() {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [selectedImages, setSelectedImages] = useState<ImageAnalysisData[]>([]);
  const [diversityOptions, setDiversityOptions] = useState<DiversityOptions>({
    prioritizeQuality: true,
    prioritizeContent: false,
    minDiversityScore: 0.3,
    maxGroupSize: 3,
    minImagesPerCategory: 1,
    targetCategories: {
      main: 1,
      detail: 3,
      lifestyle: 1,
      specification: 0
    }
  });
  
  // 이미지 분석 데이터
  const [analysisData, setAnalysisData] = useState<{
    imageUrl: string;
    quality?: ImageQualityAssessment;
    content?: ImageContentAnalysis;
  }[]>([]);
  
  // 이미지 URL 추가
  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) {
      toast({
        title: "URL이 비어있습니다",
        variant: "destructive",
        children: <p>이미지 URL을 입력해주세요.</p>
      });
      return;
    }
    
    try {
      new URL(newImageUrl); // URL 유효성 검사
      if (!imageUrls.includes(newImageUrl)) {
        setImageUrls([...imageUrls, newImageUrl]);
        setNewImageUrl('');
        
        // 임시 분석 데이터 추가 (실제로는 품질 및 내용 분석 API를 호출해야 함)
        setAnalysisData(prev => [...prev, { imageUrl: newImageUrl }]);
      } else {
        toast({
          title: "중복된 URL",
          variant: "destructive",
          children: <p>이미 추가된 이미지 URL입니다.</p>
        });
      }
    } catch (e) {
      toast({
        title: "잘못된 URL 형식",
        variant: "destructive",
        children: <p>유효한 URL 형식이 아닙니다.</p>
      });
    }
  };

  // 이미지 URL 삭제
  const handleRemoveImageUrl = (urlToRemove: string) => {
    setImageUrls(imageUrls.filter(url => url !== urlToRemove));
    setAnalysisData(analysisData.filter(data => data.imageUrl !== urlToRemove));
    setSelectedImages(selectedImages.filter(img => img.imageUrl !== urlToRemove));
  };

  // 이미지 선택 핸들러
  const handleSelectImages = (images: ImageAnalysisData[]) => {
    setSelectedImages(images);
  };

  // 데모 이미지 세트 추가
  const addDemoImages = () => {
    const demoUrls = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', // 헤드폰
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', // 시계
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80', // 신발
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80', // 스마트폰
      'https://images.unsplash.com/photo-1533139143976-30918502365b?w=800&q=80',  // 라이프스타일
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',  // 신발 측면
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80',  // 신발 정면
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',  // 신발 다른 색상
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',  // 신발 착용 컷
    ];
    
    const newUrls = demoUrls.filter(url => !imageUrls.includes(url));
    if (newUrls.length > 0) {
      setImageUrls([...imageUrls, ...newUrls]);
      
      // 임시 분석 데이터 추가
      const newAnalysisData = newUrls.map(url => ({ imageUrl: url }));
      setAnalysisData([...analysisData, ...newAnalysisData]);
      
      toast({
        title: "데모 이미지 추가됨",
        variant: "default",
        children: <p>{newUrls.length}개의 샘플 이미지가 추가되었습니다.</p>
      });
    }
  };

  // 다양성 옵션 변경 핸들러
  const handleOptionChange = (option: keyof DiversityOptions, value: any) => {
    setDiversityOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // 타겟 카테고리 옵션 변경
  const handleCategoryOptionChange = (category: keyof Required<DiversityOptions>['targetCategories'], value: number) => {
    setDiversityOptions(prev => ({
      ...prev,
      targetCategories: {
        ...prev.targetCategories,
        [category]: value
      }
    }));
  };
  
  // 선택한 이미지 URL 복사
  const copySelectedImageUrls = () => {
    if (selectedImages.length === 0) {
      toast({
        title: "선택된 이미지 없음",
        variant: "destructive",
        children: <p>복사할 이미지를 선택해주세요.</p>
      });
      return;
    }
    
    const urls = selectedImages.map(img => img.imageUrl).join('\n');
    navigator.clipboard.writeText(urls).then(() => {
      toast({
        title: "URL 복사됨",
        variant: "default",
        children: <p>{selectedImages.length}개의 이미지 URL이 복사되었습니다.</p>
      });
    }).catch(err => {
      toast({
        title: "URL 복사 실패",
        variant: "destructive",
        children: <p>클립보드 접근에 실패했습니다: {err.message}</p>
      });
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">이미지 다양성 분석</h1>
          <p className="text-muted-foreground mt-1">
            이미지 다양성을 분석하고 중복을 제거하여 최적의 이미지 세트를 추천합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 이미지 URL 관리 섹션 */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>이미지 URL 추가</CardTitle>
              <CardDescription>
                분석할 이미지의 URL을 입력하거나 데모 이미지를 사용하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url">이미지 URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="image-url"
                      placeholder="https://example.com/image.jpg"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddImageUrl()}
                    />
                    <Button 
                      onClick={handleAddImageUrl}
                      variant="secondary"
                      size="icon"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {imageUrls.length === 0 ? (
                    <p>아직 이미지 URL이 추가되지 않았습니다.</p>
                  ) : (
                    <p>{imageUrls.length}개의 이미지 URL이 추가되었습니다.</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setImageUrls([]);
                  setAnalysisData([]);
                  setSelectedImages([]);
                }}
                disabled={imageUrls.length === 0}
              >
                모두 지우기
              </Button>
              <Button onClick={addDemoImages}>
                <ImageIcon className="mr-2 h-4 w-4" />
                데모 이미지 추가
              </Button>
            </CardFooter>
          </Card>

          {imageUrls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>추가된 이미지 URL</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {imageUrls.map((url, index) => (
                    <li key={index} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{url}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveImageUrl(url)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                다양성 분석 옵션
              </CardTitle>
              <CardDescription>
                이미지 다양성 분석을 위한 설정을 조정하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="prioritize-quality"
                    checked={diversityOptions.prioritizeQuality}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      handleOptionChange('prioritizeQuality', checked === true)
                    }
                  />
                  <Label htmlFor="prioritize-quality">품질 우선시</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="prioritize-content"
                    checked={diversityOptions.prioritizeContent}
                    onCheckedChange={(checked: boolean | 'indeterminate') => 
                      handleOptionChange('prioritizeContent', checked === true)
                    }
                  />
                  <Label htmlFor="prioritize-content">내용 우선시</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min-diversity-score">최소 다양성 점수: {diversityOptions.minDiversityScore}</Label>
                  <Slider 
                    id="min-diversity-score"
                    min={0}
                    max={1}
                    step={0.1}
                    value={[diversityOptions.minDiversityScore || 0.3]}
                    onValueChange={(value: number[]) => handleOptionChange('minDiversityScore', value[0])}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-group-size">그룹당 최대 이미지 수</Label>
                  <Select 
                    value={diversityOptions.maxGroupSize?.toString()}
                    onValueChange={(value) => handleOptionChange('maxGroupSize', parseInt(value))}
                  >
                    <SelectTrigger id="max-group-size">
                      <SelectValue placeholder="그룹 크기 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1개</SelectItem>
                      <SelectItem value="2">2개</SelectItem>
                      <SelectItem value="3">3개</SelectItem>
                      <SelectItem value="4">4개</SelectItem>
                      <SelectItem value="5">5개</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>카테고리별 이미지 수</Label>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="main-count" className="text-xs">메인 이미지</Label>
                      <Select 
                        value={diversityOptions.targetCategories?.main?.toString() || "1"}
                        onValueChange={(value) => handleCategoryOptionChange('main', parseInt(value))}
                      >
                        <SelectTrigger id="main-count" className="h-8">
                          <SelectValue placeholder="개수 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0개</SelectItem>
                          <SelectItem value="1">1개</SelectItem>
                          <SelectItem value="2">2개</SelectItem>
                          <SelectItem value="3">3개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="detail-count" className="text-xs">상세 이미지</Label>
                      <Select 
                        value={diversityOptions.targetCategories?.detail?.toString() || "3"}
                        onValueChange={(value) => handleCategoryOptionChange('detail', parseInt(value))}
                      >
                        <SelectTrigger id="detail-count" className="h-8">
                          <SelectValue placeholder="개수 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0개</SelectItem>
                          <SelectItem value="1">1개</SelectItem>
                          <SelectItem value="2">2개</SelectItem>
                          <SelectItem value="3">3개</SelectItem>
                          <SelectItem value="4">4개</SelectItem>
                          <SelectItem value="5">5개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="lifestyle-count" className="text-xs">라이프스타일</Label>
                      <Select 
                        value={diversityOptions.targetCategories?.lifestyle?.toString() || "1"}
                        onValueChange={(value) => handleCategoryOptionChange('lifestyle', parseInt(value))}
                      >
                        <SelectTrigger id="lifestyle-count" className="h-8">
                          <SelectValue placeholder="개수 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0개</SelectItem>
                          <SelectItem value="1">1개</SelectItem>
                          <SelectItem value="2">2개</SelectItem>
                          <SelectItem value="3">3개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="spec-count" className="text-xs">스펙/설명</Label>
                      <Select 
                        value={diversityOptions.targetCategories?.specification?.toString() || "0"}
                        onValueChange={(value) => handleCategoryOptionChange('specification', parseInt(value))}
                      >
                        <SelectTrigger id="spec-count" className="h-8">
                          <SelectValue placeholder="개수 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0개</SelectItem>
                          <SelectItem value="1">1개</SelectItem>
                          <SelectItem value="2">2개</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedImages.length > 0 && (
            <Card className="bg-primary-50 border-primary-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>선택된 이미지</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={copySelectedImageUrls}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    URL 복사
                  </Button>
                </CardTitle>
                <CardDescription>
                  총 {selectedImages.length}개의 이미지가 선택되었습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {selectedImages.slice(0, 6).map((image, index) => (
                    <div key={index} className="h-20 bg-white rounded-md overflow-hidden border">
                      <img 
                        src={image.imageUrl} 
                        alt={`Selected image ${index + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ))}
                  {selectedImages.length > 6 && (
                    <div className="h-20 bg-white/50 rounded-md overflow-hidden border flex items-center justify-center">
                      <span className="text-sm text-gray-500">+{selectedImages.length - 6}개</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground space-y-2 w-full">
                  <p>
                    <span className="font-medium">메인 이미지:</span> {selectedImages.filter(img => 
                      img.content?.recommendedUse.section === 'main'
                    ).length}개
                  </p>
                  <p>
                    <span className="font-medium">상세 이미지:</span> {selectedImages.filter(img => 
                      img.content?.recommendedUse.section === 'detail'
                    ).length}개
                  </p>
                  <p>
                    <span className="font-medium">라이프스타일:</span> {selectedImages.filter(img => 
                      img.content?.recommendedUse.section === 'lifestyle'
                    ).length}개
                  </p>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* 이미지 다양성 분석 결과 섹션 */}
        <div className="md:col-span-2">
          <Tabs defaultValue="diversity-analysis">
            <TabsList className="mb-4">
              <TabsTrigger value="diversity-analysis" className="flex items-center gap-1.5">
                <ListFilter className="h-4 w-4" />
                <span>다양성 분석</span>
              </TabsTrigger>
              <TabsTrigger value="selected-images" className="flex items-center gap-1.5">
                <FileImage className="h-4 w-4" />
                <span>선택된 이미지 ({selectedImages.length})</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="diversity-analysis">
              <ImageDiversitySelector
                images={analysisData}
                onSelectImages={handleSelectImages}
                autoSelectBest={true}
                diversityOptions={diversityOptions}
              />
            </TabsContent>
            
            <TabsContent value="selected-images">
              {selectedImages.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">선택된 이미지 ({selectedImages.length}개)</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={copySelectedImageUrls}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      URL 복사
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedImages.map((image, index) => (
                      <Card key={index} className="overflow-hidden">
                        <div className="h-48 bg-gray-100">
                          <img 
                            src={image.imageUrl} 
                            alt={`Selected image ${index + 1}`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <CardContent className="p-3">
                          <div className="text-sm font-medium truncate">
                            {image.imageUrl.split('/').pop() || `이미지 ${index + 1}`}
                          </div>
                          {image.content && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              <Badge variant="outline" className="text-xs">
                                {image.content.recommendedUse.section === 'main' ? '메인' : 
                                  image.content.recommendedUse.section === 'detail' ? '상세' : 
                                  image.content.recommendedUse.section === 'lifestyle' ? '라이프스타일' : 
                                  image.content.recommendedUse.section === 'specification' ? '스펙' : '기타'}
                              </Badge>
                              {image.diversityScore !== undefined && (
                                <Badge variant="secondary" className="text-xs">
                                  다양성: {Math.round(image.diversityScore * 100)}%
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <FileImage className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">선택된 이미지가 없습니다.</p>
                  <p className="text-gray-400 text-sm text-center mt-2">'다양성 분석' 탭에서 이미지를 선택해주세요.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 