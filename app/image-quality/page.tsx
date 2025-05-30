/**
 * 이미지 품질 평가 페이지
 * 이미지 품질을 분석하고 가장 적합한 이미지를 자동으로 선택합니다.
 */

'use client';

import React, { useState } from 'react';
import { ImageQualityAssessment } from '@/lib/services/imageQualityService';
import ImageQualitySelector from '@/components/image-selector/ImageQualitySelector';
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
import { ImageIcon, Plus, Trash2 } from 'lucide-react';
import ImageQualityAssessmentDisplay from '@/components/image-selector/ImageQualityAssessmentDisplay';

/**
 * 이미지 품질 평가 페이지 컴포넌트
 */
export default function ImageQualityPage() {
  const { toast } = useToast();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<ImageQualityAssessment | null>(null);
  
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
  const handleSelectImage = (imageUrl: string, assessment: ImageQualityAssessment) => {
    setSelectedImage(assessment);
  };

  // 데모 이미지 세트 추가
  const addDemoImages = () => {
    const demoUrls = [
      'https://images.unsplash.com/photo-1615789591457-74a63395c990?w=800&q=80',
      'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&q=80',
      'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&q=60',
      'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&q=80',
      'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800&q=90'
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

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">이미지 품질 평가</h1>
          <p className="text-muted-foreground mt-1">
            품질 기준에 따라 이미지를 자동으로 평가하고 선택합니다.
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
                평가할 이미지의 URL을 입력하거나 데모 이미지를 사용하세요.
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

          {selectedImage && (
            <Card className="bg-primary-50 border-primary-200">
              <CardHeader>
                <CardTitle>선택된 이미지</CardTitle>
                <CardDescription>
                  품질 점수: {Math.round(selectedImage.overall.score * 100)}% (등급: {selectedImage.overall.grade})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <ImageQualityAssessmentDisplay
                    assessment={selectedImage}
                    showDetails={false}
                    className="max-w-[320px]"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  {selectedImage.overall.recommendation}
                </p>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* 이미지 품질 평가 결과 섹션 */}
        <div className="md:col-span-2">
          <ImageQualitySelector
            imageUrls={imageUrls}
            onSelectImage={handleSelectImage}
            autoSelectBest={true}
            showDetails={true}
            qualityOptions={{
              minWidth: 640,
              minHeight: 480,
              includeMetadata: true,
              weightFactors: {
                resolution: 1.2,
                sharpness: 1.0,
                noise: 0.8,
                colorQuality: 1.0,
                lighting: 0.7,
                compression: 0.5
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 