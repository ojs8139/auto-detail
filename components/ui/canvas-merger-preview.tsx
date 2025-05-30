"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { CanvasMerger, CanvasMergerUtils } from '@/lib/canvas-merger';
import { Button } from './button';
import { Slider } from './slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Download, File, Loader2, Image as ImageIcon, Grid2X2, FileText } from 'lucide-react';

interface CanvasMergerPreviewProps {
  canvases?: HTMLCanvasElement[];
  fabricCanvases?: any[]; // Fabric.js 캔버스 객체
  imageUrls?: string[];
  className?: string;
  onExport?: (dataUrl: string) => void;
}

export function CanvasMergerPreview({
  canvases = [],
  fabricCanvases = [],
  imageUrls = [],
  className,
  onExport
}: CanvasMergerPreviewProps) {
  const [mergedImageUrl, setMergedImageUrl] = useState<string>('');
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [spacing, setSpacing] = useState<number>(10);
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff');
  const [format, setFormat] = useState<'png' | 'jpeg' | 'svg' | 'pdf'>('png');
  const [quality, setQuality] = useState<number>(1.0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [mergeSource, setMergeSource] = useState<'canvases' | 'images'>('canvases');
  const previewRef = useRef<HTMLDivElement>(null);
  const [showSections, setShowSections] = useState<boolean>(false);
  const [sections, setSections] = useState<Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-1);
  const [activeTab, setActiveTab] = useState<string>("preview");
  
  // 사용 가능한 소스 결정
  const hasCanvases = canvases.length > 0 || fabricCanvases.length > 0;
  const hasImages = imageUrls.length > 0;
  
  // 초기 소스 설정
  useEffect(() => {
    if (!hasCanvases && hasImages) {
      setMergeSource('images');
    } else if (hasCanvases) {
      setMergeSource('canvases');
    }
  }, [hasCanvases, hasImages]);

  // 이미지 병합 함수
  const updateMergedImage = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // 소스에 따라 다른 병합 방법 사용
      let dataUrl = '';
      
      if (mergeSource === 'canvases') {
        if (fabricCanvases.length > 0) {
          // Fabric.js 캔버스 병합
          dataUrl = await CanvasMerger.mergeAndExport(fabricCanvases, {
            direction,
            spacing,
            backgroundColor,
            format,
            quality
          });
        } else if (canvases.length > 0) {
          // HTML 캔버스 병합
          dataUrl = await CanvasMerger.mergeAndExport(canvases, {
            direction,
            spacing,
            backgroundColor,
            format,
            quality
          });
        }
      } else if (mergeSource === 'images' && imageUrls.length > 0) {
        // 이미지 URL 병합
        const mergedCanvas = await CanvasMerger.mergeImages(imageUrls, {
          direction,
          spacing,
          backgroundColor
        });
        
        // 형식에 따라 처리
        if (format === 'svg') {
          dataUrl = await CanvasMerger.canvasToSVG(mergedCanvas);
        } else if (format === 'pdf') {
          dataUrl = await CanvasMerger.canvasToPDF(mergedCanvas);
        } else {
          dataUrl = mergedCanvas.toDataURL(`image/${format}`, quality);
        }
      }
      
      // 결과 설정
      setMergedImageUrl(dataUrl);
      
      // 섹션 초기화 (전체 이미지를 하나의 섹션으로)
      if (dataUrl && !sections.length) {
        // 이미지 로드하여 크기 가져오기
        const img = new Image();
        img.onload = () => {
          setSections([{
            x: 0,
            y: 0,
            width: img.width,
            height: img.height
          }]);
        };
        img.src = dataUrl;
      }
    } catch (error) {
      console.error('이미지 병합 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    mergeSource, fabricCanvases, canvases, imageUrls, 
    direction, spacing, backgroundColor, format, quality, sections
  ]);
  
  // 병합 옵션이 변경될 때 이미지 업데이트
  useEffect(() => {
    if ((hasCanvases && mergeSource === 'canvases') || 
        (hasImages && mergeSource === 'images')) {
      updateMergedImage();
    }
  }, [
    updateMergedImage, hasCanvases, hasImages, mergeSource
  ]);
  
  // 섹션 추가
  const addSection = useCallback(() => {
    if (!mergedImageUrl) return;
    
    // 이미지 로드하여 크기 가져오기
    const img = new Image();
    img.onload = () => {
      const halfWidth = Math.floor(img.width / 2);
      const halfHeight = Math.floor(img.height / 2);
      
      setSections(prev => [
        ...prev,
        {
          x: Math.min(50, halfWidth),
          y: Math.min(50, halfHeight),
          width: Math.min(300, halfWidth),
          height: Math.min(300, halfHeight)
        }
      ]);
    };
    img.src = mergedImageUrl;
  }, [mergedImageUrl]);
  
  // 섹션 삭제
  const removeSection = useCallback((index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
    if (activeSectionIndex === index) {
      setActiveSectionIndex(-1);
    } else if (activeSectionIndex > index) {
      setActiveSectionIndex(prev => prev - 1);
    }
  }, [activeSectionIndex]);
  
  // 섹션 내보내기
  const exportSection = useCallback(async (index: number) => {
    if (!mergedImageUrl || index < 0 || index >= sections.length) return;
    
    try {
      setIsProcessing(true);
      
      // 이미지를 캔버스로 변환
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = mergedImageUrl;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        
        // 섹션 추출
        const section = sections[index];
        const sectionCanvas = CanvasMerger.extractSection(canvas, section);
        
        // 섹션을 현재 형식으로 내보내기
        let sectionDataUrl: string;
        if (format === 'svg') {
          sectionDataUrl = await CanvasMerger.canvasToSVG(sectionCanvas);
        } else if (format === 'pdf') {
          sectionDataUrl = await CanvasMerger.canvasToPDF(sectionCanvas);
        } else {
          sectionDataUrl = sectionCanvas.toDataURL(`image/${format}`, quality);
        }
        
        // 다운로드 또는 콜백 호출
        if (onExport) {
          onExport(sectionDataUrl);
        } else {
          const extension = format === 'jpeg' ? 'jpg' : format;
          CanvasMergerUtils.downloadDataUrl(
            sectionDataUrl, 
            `section-${index + 1}-${Date.now()}.${extension}`
          );
        }
      }
    } catch (error) {
      console.error('섹션 내보내기 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [mergedImageUrl, sections, format, quality, onExport]);
  
  // 전체 이미지 내보내기
  const exportMergedImage = useCallback(() => {
    if (!mergedImageUrl) return;
    
    try {
      if (onExport) {
        onExport(mergedImageUrl);
      } else {
        const extension = format === 'jpeg' ? 'jpg' : format;
        CanvasMergerUtils.downloadDataUrl(
          mergedImageUrl, 
          `merged-image-${Date.now()}.${extension}`
        );
      }
    } catch (error) {
      console.error('이미지 내보내기 오류:', error);
    }
  }, [mergedImageUrl, format, onExport]);

  // 형식에 따른 아이콘 선택
  const getFormatIcon = useCallback(() => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-4 h-4 mr-1" />;
      default:
        return <Download className="w-4 h-4 mr-1" />;
    }
  }, [format]);

  return (
    <div className={cn("flex flex-col space-y-4", className)} ref={previewRef}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">이미지 병합 및 내보내기</h3>
        <Button 
          variant="default" 
          size="sm"
          className="flex items-center gap-1"
          onClick={exportMergedImage}
          disabled={!mergedImageUrl || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            getFormatIcon()
          )}
          내보내기
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">미리보기</TabsTrigger>
          <TabsTrigger value="settings">병합 설정</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <div className="border rounded-md p-4 bg-muted/10">
            {mergedImageUrl ? (
              <div className="relative">
                <div className="max-w-full overflow-auto">
                  <div className="relative inline-block">
                    {format === 'pdf' ? (
                      <div className="flex flex-col items-center justify-center p-8 border bg-muted/20 min-h-[200px]">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">PDF 미리보기는 제공되지 않습니다.</p>
                        <p className="text-xs text-muted-foreground mt-1">내보내기 버튼을 클릭하여 PDF를 다운로드하세요.</p>
                      </div>
                    ) : (
                      <img 
                        src={mergedImageUrl} 
                        alt="Merged Canvas Preview" 
                        className="max-w-full h-auto border"
                      />
                    )}
                    
                    {format !== 'pdf' && showSections && sections.map((section, index) => (
                      <div 
                        key={index}
                        className={cn(
                          "absolute border-2 cursor-pointer",
                          activeSectionIndex === index ? "border-primary" : "border-dashed border-muted-foreground/70"
                        )}
                        style={{
                          left: `${section.x}px`,
                          top: `${section.y}px`,
                          width: `${section.width}px`,
                          height: `${section.height}px`
                        }}
                        onClick={() => setActiveSectionIndex(index)}
                      >
                        <div className="absolute top-0 right-0 p-1 bg-background/80 text-xs">
                          섹션 {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {format !== 'pdf' && showSections && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSection}
                    >
                      섹션 추가
                    </Button>
                    
                    {sections.map((_, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <Button
                          variant={activeSectionIndex === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveSectionIndex(index)}
                        >
                          섹션 {index + 1}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-0 w-7 h-7"
                          onClick={() => exportSection(index)}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-0 w-7 h-7 text-destructive hover:text-destructive"
                          onClick={() => removeSection(index)}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 flex justify-between">
                  {format !== 'pdf' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSections(!showSections)}
                      className="flex items-center gap-1.5"
                    >
                      <Grid2X2 className="w-4 h-4" />
                      {showSections ? '섹션 숨기기' : '섹션 표시'}
                    </Button>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    {format.toUpperCase()} 형식
                    {(format === 'png' || format === 'jpeg') && ` | 품질: ${Math.round(quality * 100)}%`}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
                    <p className="text-muted-foreground">이미지 병합 중...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-muted-foreground">병합할 캔버스나 이미지를 제공해주세요.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <div className="border rounded-md p-4 bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 소스 선택 */}
              {hasCanvases && hasImages && (
                <div className="space-y-2">
                  <Label>병합 소스</Label>
                  <RadioGroup 
                    value={mergeSource} 
                    onValueChange={(value) => setMergeSource(value as 'canvases' | 'images')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="canvases" id="canvases" />
                      <Label htmlFor="canvases">캔버스</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="images" id="images" />
                      <Label htmlFor="images">이미지</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {/* 방향 선택 */}
              <div className="space-y-2">
                <Label>병합 방향</Label>
                <RadioGroup 
                  value={direction} 
                  onValueChange={(value) => setDirection(value as 'vertical' | 'horizontal')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="vertical" id="vertical" />
                    <Label htmlFor="vertical">세로 방향</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="horizontal" id="horizontal" />
                    <Label htmlFor="horizontal">가로 방향</Label>
                  </div>
                </RadioGroup>
              </div>
              
              {/* 간격 설정 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>요소 간격</Label>
                  <span className="text-sm">{spacing}px</span>
                </div>
                <Slider
                  value={[spacing]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => setSpacing(value[0])}
                />
              </div>
              
              {/* 배경색 설정 */}
              <div className="space-y-2">
                <Label>배경색</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-10 h-10 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md bg-background"
                  />
                </div>
              </div>
              
              {/* 내보내기 형식 */}
              <div className="space-y-2">
                <Label>내보내기 형식</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as 'png' | 'jpeg' | 'svg' | 'pdf')}>
                  <SelectTrigger>
                    <SelectValue placeholder="형식 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="svg">SVG</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 품질 설정 (JPEG 전용) */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>품질</Label>
                  <span className="text-sm">{Math.round(quality * 100)}%</span>
                </div>
                <Slider
                  value={[quality * 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setQuality(value[0] / 100)}
                  disabled={format !== 'jpeg' && format !== 'png'}
                />
                <p className="text-xs text-muted-foreground">
                  {format === 'jpeg' ? 'JPEG 이미지 압축 품질' : 
                   format === 'png' ? '* PNG는 무손실 형식으로, 품질 설정이 적용되지 않습니다.' :
                   '* 이 형식에는 품질 설정이 적용되지 않습니다.'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                variant="default"
                size="sm"
                disabled={isProcessing}
                onClick={updateMergedImage}
                className="flex items-center gap-1"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <File className="w-4 h-4 mr-1" />
                )}
                변경사항 적용
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 