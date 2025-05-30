/**
 * 이미지 내용 분석 페이지
 * OpenAI API를 활용하여 이미지 내용을 분석하고 결과를 표시합니다.
 */

'use client';

import React, { useState } from 'react';
import { ImageContentAnalysis } from '@/lib/services/imageContentAnalysisService';
import ImageContentSelector from '@/components/image-selector/ImageContentSelector';
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
import { ImageIcon, Plus, Trash2, LayoutGrid, Boxes, Settings, ImagePlus } from 'lucide-react';
import ImageContentAnalysisDisplay from '@/components/image-selector/ImageContentAnalysisDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

/**
 * 이미지 내용 분석 페이지 컴포넌트
 */
export default function ImageContentPage() {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<ImageContentAnalysis | null>(null);
  const [analysisOptions, setAnalysisOptions] = useState({
    productType: '일반 제품',
    targetAudience: '일반 고객',
    brandStyle: '모던',
    useCase: '상세페이지',
    detailLevel: 'standard' as 'basic' | 'standard' | 'detailed'
  });
  
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
    if (selectedImage && selectedImage.imageUrl === urlToRemove) {
      setSelectedImage(null);
    }
  };

  // 이미지 선택 핸들러
  const handleSelectImage = (imageUrl: string, analysis: ImageContentAnalysis) => {
    setSelectedImage(analysis);
  };

  // 데모 이미지 세트 추가
  const addDemoImages = () => {
    const demoUrls = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', // 헤드폰
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', // 시계
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80', // 신발
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80', // 스마트폰
      'https://images.unsplash.com/photo-1533139143976-30918502365b?w=800&q=80'  // 라이프스타일
    ];
    
    const newUrls = demoUrls.filter(url => !imageUrls.includes(url));
    if (newUrls.length > 0) {
      setImageUrls([...imageUrls, ...newUrls]);
      toast({
        title: "데모 이미지 추가됨",
        variant: "default",
        children: <p>{newUrls.length}개의 샘플 이미지가 추가되었습니다.</p>
      });
    }
  };

  // 분석 옵션 변경 핸들러
  const handleOptionChange = (option: string, value: string) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">이미지 내용 분석</h1>
          <p className="text-muted-foreground mt-1">
            OpenAI API를 활용하여 이미지 내용을 분석하고 최적의 이미지를 선택합니다.
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
                onClick={() => setImageUrls([])}
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
                분석 옵션
              </CardTitle>
              <CardDescription>
                내용 분석을 위한 맥락 정보를 설정하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product-type">제품 유형</Label>
                  <Select 
                    value={analysisOptions.productType}
                    onValueChange={(value) => handleOptionChange('productType', value)}
                  >
                    <SelectTrigger id="product-type">
                      <SelectValue placeholder="제품 유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="일반 제품">일반 제품</SelectItem>
                      <SelectItem value="의류">의류</SelectItem>
                      <SelectItem value="전자제품">전자제품</SelectItem>
                      <SelectItem value="가구">가구</SelectItem>
                      <SelectItem value="화장품">화장품</SelectItem>
                      <SelectItem value="식품">식품</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target-audience">타겟 고객층</Label>
                  <Select 
                    value={analysisOptions.targetAudience}
                    onValueChange={(value) => handleOptionChange('targetAudience', value)}
                  >
                    <SelectTrigger id="target-audience">
                      <SelectValue placeholder="타겟 고객층 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="일반 고객">일반 고객</SelectItem>
                      <SelectItem value="20대 여성">20대 여성</SelectItem>
                      <SelectItem value="20대 남성">20대 남성</SelectItem>
                      <SelectItem value="30-40대 여성">30-40대 여성</SelectItem>
                      <SelectItem value="30-40대 남성">30-40대 남성</SelectItem>
                      <SelectItem value="청소년">청소년</SelectItem>
                      <SelectItem value="어린이">어린이</SelectItem>
                      <SelectItem value="고령자">고령자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand-style">브랜드 스타일</Label>
                  <Select 
                    value={analysisOptions.brandStyle}
                    onValueChange={(value) => handleOptionChange('brandStyle', value)}
                  >
                    <SelectTrigger id="brand-style">
                      <SelectValue placeholder="브랜드 스타일 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="모던">모던</SelectItem>
                      <SelectItem value="캐주얼">캐주얼</SelectItem>
                      <SelectItem value="럭셔리">럭셔리</SelectItem>
                      <SelectItem value="미니멀">미니멀</SelectItem>
                      <SelectItem value="클래식">클래식</SelectItem>
                      <SelectItem value="빈티지">빈티지</SelectItem>
                      <SelectItem value="트렌디">트렌디</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="use-case">사용 목적</Label>
                  <Select 
                    value={analysisOptions.useCase}
                    onValueChange={(value) => handleOptionChange('useCase', value)}
                  >
                    <SelectTrigger id="use-case">
                      <SelectValue placeholder="사용 목적 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="상세페이지">상세페이지</SelectItem>
                      <SelectItem value="배너">배너</SelectItem>
                      <SelectItem value="소셜미디어">소셜미디어</SelectItem>
                      <SelectItem value="상품 목록">상품 목록</SelectItem>
                      <SelectItem value="광고">광고</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="detail-level">분석 상세도</Label>
                  <Select 
                    value={analysisOptions.detailLevel}
                    onValueChange={(value) => handleOptionChange('detailLevel', value as 'basic' | 'standard' | 'detailed')}
                  >
                    <SelectTrigger id="detail-level">
                      <SelectValue placeholder="분석 상세도 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">기본</SelectItem>
                      <SelectItem value="standard">표준</SelectItem>
                      <SelectItem value="detailed">상세</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    상세 분석은 API 비용이 더 높습니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedImage && (
            <Card className="bg-primary-50 border-primary-200">
              <CardHeader>
                <CardTitle>선택된 이미지</CardTitle>
                <CardDescription>
                  분석 결과: {selectedImage.contentType.isProduct ? '제품' : 
                    selectedImage.contentType.isLifestyle ? '라이프스타일' : 
                    selectedImage.contentType.isInfographic ? '인포그래픽' : 
                    selectedImage.contentType.isPerson ? '인물' : '기타'} 이미지
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <ImageContentAnalysisDisplay
                    analysis={selectedImage}
                    showDetails={false}
                    className="max-w-[320px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className="text-xs text-muted-foreground space-y-2 w-full">
                  <p>
                    <span className="font-medium">상업적 가치:</span> {Math.round(selectedImage.commercialValue.score * 100)}%
                  </p>
                  <p>
                    <span className="font-medium">권장 사용처:</span> {selectedImage.recommendedUse.section === 'main' ? '메인 이미지' : 
                      selectedImage.recommendedUse.section === 'detail' ? '상세 이미지' : 
                      selectedImage.recommendedUse.section === 'lifestyle' ? '라이프스타일' : 
                      selectedImage.recommendedUse.section === 'specification' ? '스펙/설명' : '기타'}
                  </p>
                  <p>
                    <span className="font-medium">분위기:</span> {selectedImage.mood.tags.slice(0, 3).join(', ')}
                  </p>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* 이미지 내용 분석 결과 섹션 */}
        <div className="md:col-span-2">
          <Tabs defaultValue="content-analysis">
            <TabsList className="mb-4">
              <TabsTrigger value="content-analysis" className="flex items-center gap-1.5">
                <LayoutGrid className="h-4 w-4" />
                <span>내용 분석</span>
              </TabsTrigger>
              <TabsTrigger value="content-categories" className="flex items-center gap-1.5">
                <Boxes className="h-4 w-4" />
                <span>이미지 분류</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="content-analysis">
              <ImageContentSelector
                imageUrls={imageUrls}
                onSelectImage={handleSelectImage}
                autoSelectBest={true}
                showDetails={true}
                analysisOptions={analysisOptions}
              />
            </TabsContent>
            
            <TabsContent value="content-categories">
              {imageUrls.length > 0 ? (
                <p className="text-center py-8">이미지 분류 기능은 현재 개발 중입니다.</p>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">분석할 이미지가 없습니다.</p>
                  <p className="text-gray-400 text-sm text-center mt-2">이미지 URL을 추가하거나 데모 이미지를 사용해보세요.</p>
                  <Button variant="outline" className="mt-4" onClick={addDemoImages}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    데모 이미지 추가
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 