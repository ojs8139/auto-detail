"use client";

import { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Label } from './label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Loader2, Upload, ImageIcon, Replace, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 이미지 선택기 컴포넌트 Props
 */
interface ImageSelectorProps {
  /**
   * 현재 선택된 이미지 URL 또는 데이터 URL
   */
  currentImage?: string;
  
  /**
   * 새 이미지가 선택될 때 호출되는 콜백 함수
   */
  onImageSelected?: (imageDataUrl: string, imageFile?: File) => void;
  
  /**
   * 이미지가 제거될 때 호출되는 콜백 함수
   */
  onImageRemoved?: () => void;
  
  /**
   * 이미지 선택이 취소될 때 호출되는 콜백 함수
   */
  onCancel?: () => void;
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
  
  /**
   * 이미지가 로드 중인지 여부
   */
  isLoading?: boolean;
  
  /**
   * 선택 버튼에 표시할 텍스트
   */
  buttonText?: string;
  
  /**
   * 선택기의 기본 너비
   */
  width?: number;
  
  /**
   * 선택기의 기본 높이
   */
  height?: number;
  
  /**
   * 샘플 이미지 URL 목록
   */
  sampleImages?: string[];
}

/**
 * 이미지 선택 및 교체를 위한 UI 컴포넌트
 */
export function ImageSelector({
  currentImage,
  onImageSelected,
  onImageRemoved,
  onCancel,
  className,
  isLoading = false,
  buttonText = '이미지 선택',
  width = 300,
  height = 200,
  sampleImages = [],
}: ImageSelectorProps) {
  // 상태 관리
  const [selectedTab, setSelectedTab] = useState<string>('upload');
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 파일 선택 처리
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 이미지 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    // 파일 최대 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }
    
    // 파일을 데이터 URL로 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);
      
      // 콜백 호출
      if (onImageSelected) {
        onImageSelected(dataUrl, file);
      }
      
      // 팝오버 닫기
      setIsPopoverOpen(false);
    };
    
    reader.readAsDataURL(file);
    
    // 파일 입력 초기화
    if (event.target) {
      event.target.value = '';
    }
  }, [onImageSelected]);
  
  // 파일 선택 버튼 클릭 처리
  const handleSelectFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  // 샘플 이미지 선택 처리
  const handleSampleSelect = useCallback((imageUrl: string) => {
    setPreviewImage(imageUrl);
    
    // 이미지 URL을 가져와 데이터 URL로 변환
    fetch(imageUrl)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          
          // 콜백 호출
          if (onImageSelected) {
            onImageSelected(dataUrl);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('샘플 이미지 로드 오류:', error);
      });
    
    // 팝오버 닫기
    setIsPopoverOpen(false);
  }, [onImageSelected]);
  
  // 이미지 제거 처리
  const handleRemoveImage = useCallback(() => {
    setPreviewImage(null);
    
    // 콜백 호출
    if (onImageRemoved) {
      onImageRemoved();
    }
  }, [onImageRemoved]);
  
  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    // 이미지 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    // 파일을 데이터 URL로 변환
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewImage(dataUrl);
      
      // 콜백 호출
      if (onImageSelected) {
        onImageSelected(dataUrl, file);
      }
    };
    
    reader.readAsDataURL(file);
  }, [onImageSelected]);
  
  // 외부 URL 입력 처리
  const handleExternalUrl = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const url = formData.get('imageUrl') as string;
    
    if (!url) return;
    
    // URL 유효성 검사
    try {
      new URL(url);
    } catch (error) {
      alert('유효한 URL을 입력해주세요.');
      return;
    }
    
    // 이미지 URL 설정
    setPreviewImage(url);
    
    // 콜백 호출
    if (onImageSelected) {
      onImageSelected(url);
    }
    
    // 팝오버 닫기
    setIsPopoverOpen(false);
    
    // 폼 초기화
    e.currentTarget.reset();
  }, [onImageSelected]);
  
  return (
    <div className={cn("flex flex-col", className)}>
      {/* 현재 이미지 표시 영역 */}
      <div 
        className={cn(
          "relative flex items-center justify-center border-2 border-dashed rounded-md overflow-hidden transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-input",
          "hover:border-primary/50"
        )}
        style={{ width, height, minHeight: 150 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">이미지 로딩 중...</p>
          </div>
        ) : previewImage ? (
          <>
            <img 
              src={previewImage} 
              alt="Selected" 
              className="max-w-full max-h-full object-contain"
            />
            
            {/* 이미지 컨트롤 오버레이 */}
            <div className="absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="secondary">
                      <Replace className="w-4 h-4 mr-1" />
                      교체
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <Tabs defaultValue="upload" value={selectedTab} onValueChange={setSelectedTab}>
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="upload">업로드</TabsTrigger>
                        <TabsTrigger value="sample">샘플</TabsTrigger>
                        <TabsTrigger value="url">URL</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="upload" className="p-1">
                        <div className="flex flex-col gap-4">
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                          
                          <div 
                            className={cn(
                              "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer",
                              "hover:border-primary/50 hover:bg-muted/50 transition-colors"
                            )}
                            onClick={handleSelectFile}
                          >
                            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              클릭하여 이미지 선택 또는 드래그 앤 드롭
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              PNG, JPG, GIF 지원 (최대 10MB)
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="sample" className="p-1">
                        {sampleImages.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {sampleImages.map((url, index) => (
                              <div 
                                key={index}
                                className="border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                onClick={() => handleSampleSelect(url)}
                              >
                                <img 
                                  src={url} 
                                  alt={`Sample ${index + 1}`}
                                  className="w-full h-24 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-6">
                            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              샘플 이미지가 없습니다
                            </p>
                          </div>
                        )}
                      </TabsContent>
                      
                      <TabsContent value="url" className="p-1">
                        <form onSubmit={handleExternalUrl} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="imageUrl">이미지 URL</Label>
                            <div className="flex gap-2">
                              <input
                                id="imageUrl"
                                name="imageUrl"
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                className="flex-1 px-3 py-2 rounded-md border"
                                required
                              />
                              <Button type="submit" size="sm">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                확인
                              </Button>
                            </div>
                          </div>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </PopoverContent>
                </Popover>
                
                <Button size="sm" variant="destructive" onClick={handleRemoveImage}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  제거
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground mb-4">이미지가 없습니다</p>
            
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  {buttonText}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <Tabs defaultValue="upload" value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="upload">업로드</TabsTrigger>
                    <TabsTrigger value="sample">샘플</TabsTrigger>
                    <TabsTrigger value="url">URL</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="p-1">
                    <div className="flex flex-col gap-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      
                      <div 
                        className={cn(
                          "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer",
                          "hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        )}
                        onClick={handleSelectFile}
                      >
                        <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          클릭하여 이미지 선택 또는 드래그 앤 드롭
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, GIF 지원 (최대 10MB)
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="sample" className="p-1">
                    {sampleImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {sampleImages.map((url, index) => (
                          <div 
                            key={index}
                            className="border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                            onClick={() => handleSampleSelect(url)}
                          >
                            <img 
                              src={url} 
                              alt={`Sample ${index + 1}`}
                              className="w-full h-24 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6">
                        <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          샘플 이미지가 없습니다
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="url" className="p-1">
                    <form onSubmit={handleExternalUrl} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">이미지 URL</Label>
                        <div className="flex gap-2">
                          <input
                            id="imageUrl"
                            name="imageUrl"
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 px-3 py-2 rounded-md border"
                            required
                          />
                          <Button type="submit" size="sm">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            확인
                          </Button>
                        </div>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
      
      {/* 도움말 텍스트 */}
      <p className="text-xs text-muted-foreground mt-2">
        이미지를 끌어다 놓거나 클릭하여 이미지를 선택할 수 있습니다.
      </p>
    </div>
  );
} 