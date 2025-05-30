"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { HiResGenerator, HiResUtils } from '@/lib/hi-res-generator';
import { Button } from './button';
import { Slider } from './slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Download, Loader2, Image as ImageIcon, ZoomIn, Info, RotateCw } from 'lucide-react';

interface HiResPreviewProps {
  imageUrl?: string;
  canvasElement?: HTMLCanvasElement;
  className?: string;
  onExport?: (dataUrl: string) => void;
}

export function HiResPreview({
  imageUrl,
  canvasElement,
  className,
  onExport
}: HiResPreviewProps) {
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [scale, setScale] = useState<number>(2);
  const [quality, setQuality] = useState<number>(1.0);
  const [method, setMethod] = useState<'bilinear' | 'bicubic' | 'lanczos'>('bicubic');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("settings");
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [imageInfo, setImageInfo] = useState<{
    original: { width: number; height: number; size: number };
    processed: { width: number; height: number; size: number };
  } | null>(null);
  
  const previewRef = useRef<HTMLDivElement>(null);
  
  // 원본 이미지 URL 설정
  useEffect(() => {
    if (imageUrl) {
      setOriginalImageUrl(imageUrl);
    } else if (canvasElement) {
      const dataUrl = canvasElement.toDataURL('image/png');
      setOriginalImageUrl(dataUrl);
    }
  }, [imageUrl, canvasElement]);
  
  // 이미지 처리 함수
  const processImage = useCallback(async () => {
    try {
      if (!originalImageUrl) return;
      
      setIsProcessing(true);
      
      // 고해상도 이미지 생성
      const hiResUrl = await HiResGenerator.generateHiRes(originalImageUrl, {
        scale,
        quality,
        method,
        maxWidth: 6000,
        maxHeight: 6000,
        preserveAspectRatio: true
      });
      
      setProcessedImageUrl(hiResUrl);
      
      // 이미지 정보 업데이트
      const originalInfo = await HiResUtils.getImageInfo(originalImageUrl);
      const processedInfo = await HiResUtils.getImageInfo(hiResUrl);
      
      setImageInfo({
        original: {
          width: originalInfo.width,
          height: originalInfo.height,
          size: originalInfo.size
        },
        processed: {
          width: processedInfo.width,
          height: processedInfo.height,
          size: processedInfo.size
        }
      });
      
      // 처리 후 결과 탭으로 전환
      setActiveTab("result");
    } catch (error) {
      console.error('이미지 처리 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImageUrl, scale, quality, method]);
  
  // 이미지 내보내기
  const handleExport = useCallback(() => {
    if (!processedImageUrl) return;
    
    try {
      if (onExport) {
        onExport(processedImageUrl);
      } else {
        // 기본 동작: 다운로드
        const link = document.createElement('a');
        link.download = `hi-res-image-${Date.now()}.png`;
        link.href = processedImageUrl;
        link.click();
      }
    } catch (error) {
      console.error('내보내기 오류:', error);
    }
  }, [processedImageUrl, onExport]);
  
  // 이미지 비교 토글
  const toggleCompare = useCallback(() => {
    setIsComparing(!isComparing);
  }, [isComparing]);
  
  // 예상 파일 크기 계산
  const estimatedSize = useCallback(() => {
    if (!originalImageUrl) return '계산 중...';
    
    try {
      const img = new Image();
      img.src = originalImageUrl;
      
      // 이미지가 로드되지 않은 경우
      if (!img.width || !img.height) return '계산 중...';
      
      const estimatedBytes = HiResGenerator.estimateFileSize(img.width, img.height, {
        scale,
        quality,
        format: 'png'
      });
      
      return HiResUtils.formatFileSize(estimatedBytes);
    } catch (error) {
      console.error('크기 계산 오류:', error);
      return '계산할 수 없음';
    }
  }, [originalImageUrl, scale, quality]);
  
  return (
    <div className={cn("flex flex-col space-y-4", className)} ref={previewRef}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">고해상도 이미지 생성</h3>
        
        {processedImageUrl && (
          <Button 
            variant="default" 
            size="sm"
            className="flex items-center gap-1"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-1" />
            내보내기
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">설정</TabsTrigger>
          <TabsTrigger value="result" disabled={!processedImageUrl}>결과</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="mt-4">
          <div className="border rounded-md p-4 bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 스케일 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>스케일</Label>
                  <span className="text-sm">{scale}x</span>
                </div>
                <Slider
                  value={[scale]}
                  min={1}
                  max={4}
                  step={0.5}
                  onValueChange={(value) => setScale(value[0])}
                />
                <p className="text-xs text-muted-foreground">
                  원본보다 {scale}배 큰 이미지 생성
                </p>
              </div>
              
              {/* 업스케일링 방법 */}
              <div className="space-y-2">
                <Label>스케일링 알고리즘</Label>
                <Select value={method} onValueChange={(value) => setMethod(value as 'bilinear' | 'bicubic' | 'lanczos')}>
                  <SelectTrigger>
                    <SelectValue placeholder="알고리즘 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bilinear">Bilinear (빠름)</SelectItem>
                    <SelectItem value="bicubic">Bicubic (균형)</SelectItem>
                    <SelectItem value="lanczos">Lanczos (고품질)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {method === 'bilinear' && '가장 빠르지만 품질이 다소 떨어질 수 있습니다.'}
                  {method === 'bicubic' && '속도와 품질의 균형이 좋은 방식입니다.'}
                  {method === 'lanczos' && '가장 높은 품질이지만 처리 시간이 오래 걸립니다.'}
                </p>
              </div>
              
              {/* 품질 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>품질</Label>
                  <span className="text-sm">{Math.round(quality * 100)}%</span>
                </div>
                <Slider
                  value={[quality * 100]}
                  min={50}
                  max={100}
                  step={5}
                  onValueChange={(value) => setQuality(value[0] / 100)}
                />
                <p className="text-xs text-muted-foreground">
                  품질을 높일수록 파일 크기가 커집니다.
                </p>
              </div>
              
              {/* 정보 표시 */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>예상 파일 크기</Label>
                  <span className="text-sm font-medium">{estimatedSize()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  <span>설정에 따라 처리 시간이 길어질 수 있습니다.</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button
                variant="default"
                disabled={!originalImageUrl || isProcessing}
                onClick={processImage}
                className="flex items-center gap-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4 mr-1" />
                    고해상도 이미지 생성
                  </>
                )}
              </Button>
            </div>
            
            {originalImageUrl && (
              <div className="mt-6">
                <Label className="block mb-2">원본 이미지</Label>
                <div className="border rounded-md overflow-hidden">
                  <img 
                    src={originalImageUrl} 
                    alt="원본 이미지"
                    className="max-w-full h-auto"
                  />
                </div>
                {imageInfo?.original && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {imageInfo.original.width} × {imageInfo.original.height} 픽셀 | {HiResUtils.formatFileSize(imageInfo.original.size)}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="result" className="mt-4">
          <div className="border rounded-md p-4 bg-muted/10">
            {processedImageUrl ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">고해상도 결과</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleCompare}
                      className="flex items-center gap-1.5"
                    >
                      <RotateCw className="w-4 h-4" />
                      {isComparing ? '결과만 보기' : '원본과 비교'}
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleExport}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      내보내기
                    </Button>
                  </div>
                </div>
                
                {isComparing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium mb-2">원본</h5>
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={originalImageUrl} 
                          alt="원본 이미지"
                          className="max-w-full h-auto"
                        />
                      </div>
                      {imageInfo?.original && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {imageInfo.original.width} × {imageInfo.original.height} 픽셀 | {HiResUtils.formatFileSize(imageInfo.original.size)}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">고해상도</h5>
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={processedImageUrl} 
                          alt="고해상도 이미지"
                          className="max-w-full h-auto"
                        />
                      </div>
                      {imageInfo?.processed && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {imageInfo.processed.width} × {imageInfo.processed.height} 픽셀 | {HiResUtils.formatFileSize(imageInfo.processed.size)}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={processedImageUrl} 
                        alt="고해상도 이미지"
                        className="max-w-full h-auto"
                      />
                    </div>
                    {imageInfo?.processed && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {imageInfo.processed.width} × {imageInfo.processed.height} 픽셀 | {HiResUtils.formatFileSize(imageInfo.processed.size)}
                        {imageInfo.original && (
                          <span className="ml-2">
                            | 원본 대비 {Math.round((imageInfo.processed.width / imageInfo.original.width) * 100) / 100}x 크기
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="bg-muted/30 p-3 rounded-md text-sm">
                  <h5 className="font-medium mb-1">처리 정보</h5>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li><span className="font-medium">스케일:</span> {scale}x</li>
                    <li><span className="font-medium">알고리즘:</span> {method}</li>
                    <li><span className="font-medium">품질:</span> {Math.round(quality * 100)}%</li>
                    {imageInfo && (
                      <li><span className="font-medium">크기 증가:</span> {Math.round((imageInfo.processed.size / imageInfo.original.size) * 100) / 100}x</li>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">먼저 이미지를 처리해주세요.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 