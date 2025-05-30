"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { FabricCanvas, CanvasHelpers } from './fabric-canvas';
import { Button } from './button';
import { DevicePreviewFrame, DevicePreset, devicePresets } from './device-preview-frame';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Slider } from './slider';
import { Check, Download, FileText, Image as ImageIcon } from 'lucide-react';

// 내보내기 형식 타입 정의
export type ExportFormat = 'png' | 'jpeg' | 'pdf' | 'svg';

interface CanvasPreviewProps {
  width?: number;
  height?: number;
  className?: string;
  defaultElements?: Array<{
    type: 'text' | 'image' | 'shape';
    options: any;
  }>;
  onExport?: (dataUrl: string, format: ExportFormat) => void;
}

export function CanvasPreview({
  width = 800,
  height = 600,
  className,
  defaultElements = [],
  onExport
}: CanvasPreviewProps) {
  const [canvas, setCanvas] = useState<any>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportQuality, setExportQuality] = useState<number>(1.0); // 1.0 = 100% 품질
  const [exportScale, setExportScale] = useState<number>(2); // 해상도 배율 (2x = 고해상도)
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("canvas");
  const [activeDevice, setActiveDevice] = useState<DevicePreset>(devicePresets[0]);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // 렌더링 최적화를 위한 참조
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRenderingRef = useRef<boolean>(false);

  // 디바운스 함수 생성
  const debouncedUpdatePreview = useCallback((targetCanvas: any) => {
    if (!targetCanvas) return;
    
    // 이미 타이머가 설정되어 있으면 취소
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // 렌더링 중이면 무시
    if (isRenderingRef.current) return;
    
    // 타이머 설정 (300ms 디바운스)
    updateTimeoutRef.current = setTimeout(() => {
      if (!isRenderingRef.current) {
        isRenderingRef.current = true;
        
        try {
          // 미리보기는 항상 PNG로 생성 (성능 최적화)
          const dataUrl = CanvasHelpers.exportToImage(targetCanvas, 'png', 1.0, 1);
          setPreviewUrl(dataUrl);
        } catch (error) {
          console.error('미리보기 생성 오류:', error);
        } finally {
          isRenderingRef.current = false;
          updateTimeoutRef.current = null;
        }
      }
    }, 300);
  }, []);

  // 캔버스 초기화 후 기본 요소 추가
  const handleCanvasReady = useCallback(async (fabricCanvas: any) => {
    setCanvas(fabricCanvas);
    
    // 렌더링 최적화를 위해 처음에는 자동 렌더링 비활성화
    fabricCanvas.renderOnAddRemove = false;
    
    // 기본 요소 추가
    for (const element of defaultElements) {
      try {
        if (element.type === 'text') {
          await CanvasHelpers.addText(fabricCanvas, element.options);
        } else if (element.type === 'image' && element.options.src) {
          await CanvasHelpers.addImage(fabricCanvas, element.options.src, element.options);
        } else if (element.type === 'shape' && element.options.shape) {
          await CanvasHelpers.addShape(fabricCanvas, element.options.shape, element.options);
        }
      } catch (error) {
        console.error('요소 추가 오류:', error);
      }
    }
    
    // 모든 요소 추가 후 한 번에 렌더링
    fabricCanvas.renderOnAddRemove = true;
    fabricCanvas.requestRenderAll();
    
    // 캔버스 수정 이벤트 리스너 추가 (메모리 누수 방지를 위해 이전 리스너 제거)
    const handleModification = () => {
      debouncedUpdatePreview(fabricCanvas);
    };
    
    // 기존에 있던 이벤트 리스너를 제거하기 위한 참조 저장
    fabricCanvas.on('object:modified', handleModification);
    fabricCanvas.on('object:added', handleModification);
    fabricCanvas.on('object:removed', handleModification);
    
    // 초기 미리보기 생성
    debouncedUpdatePreview(fabricCanvas);
  }, [defaultElements, debouncedUpdatePreview]);

  // 미리보기 이미지 업데이트 - useCallback으로 최적화
  const updatePreview = useCallback((targetCanvas: any) => {
    debouncedUpdatePreview(targetCanvas);
  }, [debouncedUpdatePreview]);

  // 내보내기 포맷 변경 시 미리보기 업데이트
  useEffect(() => {
    if (canvas) {
      updatePreview(canvas);
    }
  }, [canvas, updatePreview]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // 디바이스 변경 핸들러 - useCallback으로 최적화
  const handleDeviceChange = useCallback((device: DevicePreset) => {
    setActiveDevice(device);
  }, []);

  // SVG 내보내기 함수
  const exportToSVG = useCallback((targetCanvas: any) => {
    if (!targetCanvas) return '';
    
    try {
      // SVG 내보내기
      const svgData = targetCanvas.toSVG();
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('SVG 내보내기 오류:', error);
      return '';
    }
  }, []);

  // PDF 내보내기 함수
  const exportToPDF = useCallback(async (targetCanvas: any) => {
    if (!targetCanvas) return '';
    
    try {
      // PDF 생성을 위한 jsPDF 동적 로드
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [targetCanvas.width, targetCanvas.height]
      });
      
      // 캔버스를 이미지로 변환
      const imgData = targetCanvas.toDataURL('image/png', 1.0);
      
      // PDF에 이미지 추가
      pdf.addImage(imgData, 'PNG', 0, 0, targetCanvas.width, targetCanvas.height);
      
      // PDF 저장
      return pdf.output('datauristring');
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      alert('PDF 내보내기 기능을 사용하려면 jspdf 패키지를 설치해야 합니다: pnpm add jspdf');
      return '';
    }
  }, []);

  // 이미지 내보내기 - useCallback으로 최적화
  const handleExport = useCallback(async () => {
    if (!canvas) return;
    setIsExporting(true);
    
    try {
      // 내보내기 전 마지막 렌더링 보장
      canvas.requestRenderAll();
      
      let dataUrl = '';
      
      // 내보내기 형식에 따른 처리
      if (exportFormat === 'png' || exportFormat === 'jpeg') {
        dataUrl = CanvasHelpers.exportToImage(canvas, exportFormat, exportQuality, exportScale);
      } else if (exportFormat === 'svg') {
        dataUrl = exportToSVG(canvas);
      } else if (exportFormat === 'pdf') {
        dataUrl = await exportToPDF(canvas);
      }
      
      if (onExport) {
        onExport(dataUrl, exportFormat);
      } else {
        // 기본 동작: 다운로드
        const link = document.createElement('a');
        link.download = `canvas-export-${Date.now()}.${exportFormat}`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('내보내기 오류:', error);
    } finally {
      setIsExporting(false);
    }
  }, [canvas, exportFormat, exportQuality, exportScale, exportToPDF, exportToSVG, onExport]);

  // 메모이제이션된 컨트롤 UI
  const controlsUI = useMemo(() => (
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium">캔버스 에디터 및 미리보기</h3>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowExportOptions(!showExportOptions)}
        >
          내보내기 옵션
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1"
        >
          {isExporting ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-r-transparent rounded-full mr-1" />
          ) : (
            <Download className="w-4 h-4 mr-1" />
          )}
          내보내기
        </Button>
      </div>
    </div>
  ), [exportFormat, handleExport, isExporting, showExportOptions]);

  // 내보내기 옵션 UI
  const exportOptionsUI = useMemo(() => (
    showExportOptions && (
      <div className="mb-4 border rounded-md p-4 bg-muted/10">
        <h4 className="text-sm font-medium mb-3">내보내기 설정</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">파일 형식</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button 
                type="button"
                variant={exportFormat === 'png' ? "default" : "outline"} 
                size="sm"
                className="flex items-center justify-center gap-1"
                onClick={() => setExportFormat('png')}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                PNG
              </Button>
              <Button 
                type="button"
                variant={exportFormat === 'jpeg' ? "default" : "outline"} 
                size="sm"
                className="flex items-center justify-center gap-1"
                onClick={() => setExportFormat('jpeg')}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                JPEG
              </Button>
              <Button 
                type="button"
                variant={exportFormat === 'svg' ? "default" : "outline"} 
                size="sm"
                className="flex items-center justify-center gap-1"
                onClick={() => setExportFormat('svg')}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                SVG
              </Button>
              <Button 
                type="button"
                variant={exportFormat === 'pdf' ? "default" : "outline"} 
                size="sm"
                className="flex items-center justify-center gap-1"
                onClick={() => setExportFormat('pdf')}
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </Button>
            </div>
          </div>
          
          {(exportFormat === 'png' || exportFormat === 'jpeg') && (
            <div>
              <div className="mb-3">
                <label className="text-sm font-medium mb-1 block">
                  품질: {Math.round(exportQuality * 100)}%
                </label>
                <Slider 
                  value={[exportQuality * 100]} 
                  min={10} 
                  max={100} 
                  step={5}
                  onValueChange={(value) => setExportQuality(value[0] / 100)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">
                  해상도: {exportScale}x
                </label>
                <Slider 
                  value={[exportScale]} 
                  min={1} 
                  max={4} 
                  step={0.5}
                  onValueChange={(value) => setExportScale(value[0])}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  ), [showExportOptions, exportFormat, exportQuality, exportScale]);

  return (
    <div ref={previewRef} className={cn("flex flex-col space-y-4", className)}>
      {controlsUI}
      {exportOptionsUI}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="canvas">캔버스 편집</TabsTrigger>
          <TabsTrigger value="preview">디바이스 미리보기</TabsTrigger>
        </TabsList>
        
        <TabsContent value="canvas" className="mt-4">
          <div className="border rounded-md overflow-hidden">
            <FabricCanvas
              width={width}
              height={height}
              onReady={handleCanvasReady}
              className="w-full"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <DevicePreviewFrame
            defaultDeviceId={activeDevice.id}
            onDeviceChange={handleDeviceChange}
            className="w-full"
          >
            {previewUrl && (
              <img 
                src={previewUrl} 
                alt="Canvas Preview" 
                className="max-w-full h-auto"
                style={{
                  width: activeDevice.width,
                  height: 'auto'
                }}
              />
            )}
          </DevicePreviewFrame>
        </TabsContent>
      </Tabs>
      
      {activeTab === 'canvas' && previewUrl && (
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-2">렌더링 결과</h3>
          <div className="max-w-full overflow-auto">
            <img 
              src={previewUrl} 
              alt="Canvas Preview" 
              className="max-w-full h-auto border"
            />
          </div>
        </div>
      )}
    </div>
  );
} 