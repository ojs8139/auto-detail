"use client";

import { useState, useCallback, useEffect } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Slider } from './slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { ImageOptimizer, ImageOptimizationOptions, ImageOptimizationResult } from '@/lib/image-optimizer';
import { Loader2, FileType, ArrowRight, ZoomIn, ZoomOut, Image as ImageIcon, Download } from 'lucide-react';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { bytesToSize } from '@/lib/utils';

export interface ImageOptimizationDialogProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onApply: (optimizedImageUrl: string) => void;
  imageWidth?: number;
  imageHeight?: number;
}

export function ImageOptimizationDialog({
  imageUrl,
  isOpen,
  onClose,
  onApply,
  imageWidth,
  imageHeight,
}: ImageOptimizationDialogProps) {
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 최적화 옵션 상태
  const [options, setOptions] = useState<ImageOptimizationOptions>({
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    format: 'jpeg',
    preserveAspectRatio: true,
    autoDetectFormat: true,
  });
  
  // 최적화 결과 상태
  const [result, setResult] = useState<ImageOptimizationResult | null>(null);
  
  // 원본 이미지 정보 상태
  const [originalInfo, setOriginalInfo] = useState<{
    width: number;
    height: number;
    size: number;
  } | null>(null);
  
  // 최적화 모드 상태
  const [optimizationMode, setOptimizationMode] = useState<'manual' | 'auto'>('manual');
  const [targetSize, setTargetSize] = useState<number>(100); // 자동 모드 목표 크기 (KB)
  
  // 원본 이미지 정보 로드
  useEffect(() => {
    if (imageUrl && isOpen) {
      const loadOriginalInfo = async () => {
        setIsLoading(true);
        try {
          // 이미지 로드
          const img = new window.Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imageUrl;
          });
          
          // 원본 크기 계산
          let size = 0;
          try {
            size = ImageOptimizer.calculateDataUrlSize(imageUrl);
          } catch (error) {
            console.error('이미지 크기 계산 오류:', error);
            size = Math.floor(imageUrl.length * 0.75);
          }
          
          // 정보 설정
          setOriginalInfo({
            width: img.width,
            height: img.height,
            size,
          });
          
          // 초기 옵션 설정
          setOptions(prev => ({
            ...prev,
            maxWidth: Math.min(prev.maxWidth || 1200, img.width * 2),
            maxHeight: Math.min(prev.maxHeight || 1200, img.height * 2),
          }));
          
          // 초기 최적화 수행
          await performOptimization();
        } catch (error) {
          console.error('이미지 정본 로드 오류:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadOriginalInfo();
    }
  }, [imageUrl, isOpen]);
  
  // 최적화 수행
  const performOptimization = async () => {
    if (!imageUrl) return;
    
    setIsLoading(true);
    try {
      let result: ImageOptimizationResult;
      
      if (optimizationMode === 'auto') {
        // 자동 모드
        result = await ImageOptimizer.autoQualityOptimize(imageUrl, targetSize, {
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
          format: options.format,
          preserveAspectRatio: options.preserveAspectRatio,
          autoDetectFormat: options.autoDetectFormat,
        });
      } else {
        // 수동 모드
        result = await ImageOptimizer.optimize(imageUrl, options);
      }
      
      setResult(result);
    } catch (error) {
      console.error('이미지 최적화 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 옵션 변경 핸들러
  const handleOptionChange = useCallback((key: keyof ImageOptimizationOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);
  
  // 결과 적용 핸들러
  const handleApply = useCallback(() => {
    if (result?.dataUrl) {
      onApply(result.dataUrl);
      onClose();
    }
  }, [result, onApply, onClose]);
  
  // 옵션 변경 시 최적화 수행
  useEffect(() => {
    const timer = setTimeout(() => {
      performOptimization();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [options, optimizationMode, targetSize]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>이미지 최적화</DialogTitle>
          <DialogDescription>
            이미지 크기와 품질을 조정하여 최적화합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* 이미지 미리보기 영역 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">이미지 미리보기</h3>
              <p className="text-xs text-muted-foreground">
                {result ? `${result.width}x${result.height}px` : '로딩 중...'}
              </p>
            </div>
            
            <div className="rounded-md border overflow-hidden relative">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {result?.dataUrl ? (
                <img 
                  src={result.dataUrl} 
                  alt="Optimized Preview" 
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              ) : (
                <div className="w-full h-60 flex items-center justify-center text-muted-foreground">
                  미리보기를 불러오는 중...
                </div>
              )}
            </div>
            
            {/* 최적화 결과 요약 */}
            {result && originalInfo && (
              <div className="rounded-md border p-4 text-sm space-y-2">
                <h4 className="font-medium">최적화 결과</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">원본 크기</p>
                    <p className="font-medium">{bytesToSize(originalInfo.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">최적화 크기</p>
                    <p className="font-medium">{bytesToSize(result.optimizedSize)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">압축률</p>
                    <p className="font-medium">{result.compressionRatio.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">출력 형식</p>
                    <p className="font-medium">{result.format.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-muted-foreground">크기 감소</p>
                  <p className="font-medium text-sm">
                    {bytesToSize(originalInfo.size - result.optimizedSize)} 절약
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* 설정 영역 */}
          <div className="space-y-6">
            <Tabs defaultValue="manual" onValueChange={(value) => setOptimizationMode(value as 'manual' | 'auto')}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="manual">수동 설정</TabsTrigger>
                <TabsTrigger value="auto">자동 최적화</TabsTrigger>
              </TabsList>
              
              {/* 수동 설정 탭 */}
              <TabsContent value="manual" className="space-y-4 pt-4">
                {/* 품질 설정 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quality">이미지 품질</Label>
                    <span className="text-xs text-muted-foreground">
                      {Math.round(options.quality! * 100)}%
                    </span>
                  </div>
                  <Slider 
                    id="quality"
                    min={10} 
                    max={100} 
                    step={1}
                    value={[options.quality! * 100]}
                    onValueChange={(value) => handleOptionChange('quality', value[0] / 100)}
                  />
                  <p className="text-xs text-muted-foreground">
                    낮은 품질은 파일 크기를 줄이지만 이미지 선명도가 떨어질 수 있습니다.
                  </p>
                </div>
                
                {/* 최대 크기 설정 */}
                <div className="space-y-2">
                  <Label>최대 크기 제한</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="max-width" className="text-xs">너비</Label>
                        <span className="text-xs text-muted-foreground">{options.maxWidth}px</span>
                      </div>
                      <Slider 
                        id="max-width"
                        min={100} 
                        max={originalInfo?.width ? originalInfo.width * 2 : 2400} 
                        step={50}
                        value={[options.maxWidth!]}
                        onValueChange={(value) => handleOptionChange('maxWidth', value[0])}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="max-height" className="text-xs">높이</Label>
                        <span className="text-xs text-muted-foreground">{options.maxHeight}px</span>
                      </div>
                      <Slider 
                        id="max-height"
                        min={100} 
                        max={originalInfo?.height ? originalInfo.height * 2 : 2400} 
                        step={50}
                        value={[options.maxHeight!]}
                        onValueChange={(value) => handleOptionChange('maxHeight', value[0])}
                      />
                    </div>
                  </div>
                </div>
                
                {/* 이미지 형식 설정 */}
                <div className="space-y-2">
                  <Label htmlFor="format">출력 형식</Label>
                  <Select 
                    value={options.autoDetectFormat ? 'auto' : options.format}
                    onValueChange={(value) => {
                      if (value === 'auto') {
                        handleOptionChange('autoDetectFormat', true);
                      } else {
                        handleOptionChange('autoDetectFormat', false);
                        handleOptionChange('format', value as 'jpeg' | 'png' | 'webp');
                      }
                    }}
                  >
                    <SelectTrigger id="format">
                      <SelectValue placeholder="이미지 형식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">자동 감지 (권장)</SelectItem>
                      <SelectItem value="jpeg">JPEG (사진)</SelectItem>
                      <SelectItem value="png">PNG (투명 배경)</SelectItem>
                      <SelectItem value="webp">WebP (고압축)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 추가 옵션 */}
                <div className="space-y-2">
                  <Label>추가 옵션</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="preserve-ratio" 
                      checked={options.preserveAspectRatio} 
                      onCheckedChange={(checked) => handleOptionChange('preserveAspectRatio', checked)}
                    />
                    <Label htmlFor="preserve-ratio" className="text-sm">종횡비 유지</Label>
                  </div>
                </div>
              </TabsContent>
              
              {/* 자동 최적화 탭 */}
              <TabsContent value="auto" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="target-size">목표 파일 크기</Label>
                    <span className="text-xs text-muted-foreground">{targetSize} KB</span>
                  </div>
                  <Slider 
                    id="target-size"
                    min={10} 
                    max={1000} 
                    step={10}
                    value={[targetSize]}
                    onValueChange={(value) => setTargetSize(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    시스템이 자동으로 목표 크기에 맞는 최적의 압축 설정을 찾습니다.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>최대 크기 제한</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="auto-max-width" className="text-xs">너비</Label>
                        <span className="text-xs text-muted-foreground">{options.maxWidth}px</span>
                      </div>
                      <Slider 
                        id="auto-max-width"
                        min={100} 
                        max={originalInfo?.width ? originalInfo.width * 2 : 2400} 
                        step={50}
                        value={[options.maxWidth!]}
                        onValueChange={(value) => handleOptionChange('maxWidth', value[0])}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="auto-max-height" className="text-xs">높이</Label>
                        <span className="text-xs text-muted-foreground">{options.maxHeight}px</span>
                      </div>
                      <Slider 
                        id="auto-max-height"
                        min={100} 
                        max={originalInfo?.height ? originalInfo.height * 2 : 2400} 
                        step={50}
                        value={[options.maxHeight!]}
                        onValueChange={(value) => handleOptionChange('maxHeight', value[0])}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="auto-detect-format" 
                      checked={options.autoDetectFormat} 
                      onCheckedChange={(checked) => handleOptionChange('autoDetectFormat', checked)}
                    />
                    <Label htmlFor="auto-detect-format" className="text-sm">자동 형식 감지 사용</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="auto-preserve-ratio" 
                      checked={options.preserveAspectRatio} 
                      onCheckedChange={(checked) => handleOptionChange('preserveAspectRatio', checked)}
                    />
                    <Label htmlFor="auto-preserve-ratio" className="text-sm">종횡비 유지</Label>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button
            onClick={handleApply}
            disabled={isLoading || !result}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                최적화 적용
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 