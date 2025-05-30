"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Slider } from './slider';
import { Button } from './button';
import { Label } from './label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { 
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical, 
  Save, SunMedium, Moon, Contrast, Sparkles,
  Undo, Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { HistoryManager, ImageEditData } from '@/lib/history-manager';

/**
 * 이미지 편집기 Props
 */
interface ImageEditorProps {
  /**
   * 편집할 이미지 URL 또는 데이터 URL
   */
  src: string;
  
  /**
   * 편집이 완료된 이미지를 처리하는 콜백 함수
   */
  onComplete?: (editedImageDataUrl: string) => void;
  
  /**
   * 편집을 취소하는 콜백 함수
   */
  onCancel?: () => void;
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
  
  /**
   * 편집기의 너비
   */
  width?: number;
  
  /**
   * 편집기의 높이
   */
  height?: number;
}

/**
 * 이미지 필터 타입
 */
type FilterType = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur';

/**
 * 이미지 편집기 컴포넌트
 */
export function ImageEditor({
  src,
  onComplete,
  onCancel,
  className,
  width = 400,
  height = 300,
}: ImageEditorProps) {
  // 캔버스 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 원본 이미지 참조
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  // 히스토리 관리자 참조
  const historyRef = useRef<HistoryManager<ImageEditData>>(new HistoryManager(20));
  
  // 상태 관리
  const [rotation, setRotation] = useState<number>(0);
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [filter, setFilter] = useState<FilterType>('none');
  const [isReady, setIsReady] = useState<boolean>(false);
  
  // 히스토리 상태
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);
  
  // 이미지 로드 및 초기 렌더링
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      originalImageRef.current = img;
      setIsReady(true);
      renderImage();
    };
    
    img.onerror = () => {
      console.error('이미지 로드 실패');
    };
    
    img.src = src;
  }, [src]);
  
  // 캔버스 크기 조정
  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current || !originalImageRef.current) return;
    
    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    
    // 이미지 비율 계산
    const imgRatio = img.width / img.height;
    const containerRatio = width / height;
    
    let w, h;
    
    if (imgRatio > containerRatio) {
      // 이미지가 더 넓은 경우
      w = width;
      h = width / imgRatio;
    } else {
      // 이미지가 더 높은 경우
      h = height;
      w = height * imgRatio;
    }
    
    // 캔버스 크기 설정
    canvas.width = w;
    canvas.height = h;
  }, [width, height]);
  
  // 이미지 렌더링
  const renderImage = useCallback(() => {
    if (!canvasRef.current || !originalImageRef.current) return;
    
    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // 캔버스 크기 조정
    resizeCanvas();
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 캔버스 중앙 계산
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // 컨텍스트 상태 저장
    ctx.save();
    
    // 캔버스 중앙으로 이동
    ctx.translate(centerX, centerY);
    
    // 회전 적용
    ctx.rotate((rotation * Math.PI) / 180);
    
    // 뒤집기 적용
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    
    // 이미지 비율 계산
    const imgRatio = img.width / img.height;
    const containerRatio = canvas.width / canvas.height;
    
    let w, h;
    
    if (imgRatio > containerRatio) {
      // 이미지가 더 넓은 경우
      w = canvas.width;
      h = canvas.width / imgRatio;
    } else {
      // 이미지가 더 높은 경우
      h = canvas.height;
      w = canvas.height * imgRatio;
    }
    
    // 이미지 그리기
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    
    // 필터 적용
    if (filter !== 'none') {
      let filterValue = '';
      
      switch (filter) {
        case 'grayscale':
          filterValue = 'grayscale(100%)';
          break;
        case 'sepia':
          filterValue = 'sepia(100%)';
          break;
        case 'invert':
          filterValue = 'invert(100%)';
          break;
        case 'blur':
          filterValue = 'blur(5px)';
          break;
      }
      
      if (filterValue) {
        ctx.filter = filterValue;
        ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.filter = 'none';
      }
    }
    
    // 밝기/대비 적용
    if (brightness !== 100 || contrast !== 100) {
      const imageData = ctx.getImageData(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      const data = imageData.data;
      
      const brightnessValue = brightness / 100;
      const contrastValue = contrast / 100;
      
      for (let i = 0; i < data.length; i += 4) {
        // 밝기 조정
        data[i] = data[i] * brightnessValue;     // R
        data[i + 1] = data[i + 1] * brightnessValue; // G
        data[i + 2] = data[i + 2] * brightnessValue; // B
        
        // 대비 조정
        data[i] = ((data[i] - 128) * contrastValue) + 128;     // R
        data[i + 1] = ((data[i + 1] - 128) * contrastValue) + 128; // G
        data[i + 2] = ((data[i + 2] - 128) * contrastValue) + 128; // B
      }
      
      ctx.putImageData(imageData, -canvas.width / 2, -canvas.height / 2);
    }
    
    // 컨텍스트 상태 복원
    ctx.restore();
  }, [resizeCanvas, rotation, flipX, flipY, filter, brightness, contrast]);
  
  // 편집 상태 변경 기록
  const saveToHistory = useCallback((editType: string, parameters?: any) => {
    if (!canvasRef.current) return;
    
    // 현재 상태를 이미지로 저장
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    
    // 히스토리에 추가
    historyRef.current.addItem({
      type: 'image-edit',
      targetId: 'editor',
      description: `이미지 ${editType}`,
      data: {
        currentState: dataUrl,
        editType,
        parameters
      }
    });
  }, []);
  
  // 상태 변경 시 이미지 다시 렌더링
  useEffect(() => {
    if (isReady) {
      renderImage();
    }
  }, [isReady, renderImage, rotation, flipX, flipY, filter, brightness, contrast]);
  
  // 상태 변경 후 히스토리에 기록
  useEffect(() => {
    // 첫 로드 시에는 기록하지 않음
    if (isReady && historyRef.current.getCurrentIndex() > 0) {
      // 상태에 따라 적절한 편집 타입 결정
      let editType = 'adjust';
      let parameters = {};
      
      if (filter !== 'none') {
        editType = 'filter';
        parameters = { filter };
      } else if (rotation % 360 !== 0 || flipX || flipY) {
        editType = 'transform';
        parameters = { rotation, flipX, flipY };
      } else {
        parameters = { brightness, contrast };
      }
      
      // 일정 시간 후 히스토리에 기록 (연속 조작 최적화)
      const timeoutId = setTimeout(() => {
        saveToHistory(editType, parameters);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isReady, saveToHistory, rotation, flipX, flipY, filter, brightness, contrast]);
  
  // 편집 완료 처리
  const handleComplete = useCallback(() => {
    if (!canvasRef.current) return;
    
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
    
    if (onComplete) {
      onComplete(dataUrl);
    }
  }, [onComplete]);
  
  // 왼쪽으로 회전
  const handleRotateLeft = useCallback(() => {
    setRotation(prev => (prev - 90) % 360);
  }, []);
  
  // 오른쪽으로 회전
  const handleRotateRight = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);
  
  // 좌우 뒤집기
  const handleFlipHorizontal = useCallback(() => {
    setFlipX(prev => !prev);
  }, []);
  
  // 상하 뒤집기
  const handleFlipVertical = useCallback(() => {
    setFlipY(prev => !prev);
  }, []);
  
  // 필터 변경
  const handleFilterChange = useCallback((value: string) => {
    setFilter(value as FilterType);
  }, []);
  
  // 밝기 변경
  const handleBrightnessChange = useCallback((value: number[]) => {
    setBrightness(value[0]);
  }, []);
  
  // 대비 변경
  const handleContrastChange = useCallback((value: number[]) => {
    setContrast(value[0]);
  }, []);
  
  // 히스토리 관리자 설정
  useEffect(() => {
    const history = historyRef.current;
    
    // 히스토리 변경 리스너 설정
    const unsubscribe = history.onHistoryChange(() => {
      setCanUndo(history.canUndo());
      setCanRedo(history.canRedo());
    });
    
    // 초기 상태 기록
    if (isReady && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
      history.addItem({
        type: 'image-edit-init',
        targetId: 'initial',
        description: '초기 상태',
        data: {
          currentState: dataUrl,
          editType: 'init'
        }
      });
    }
    
    // 클린업
    return unsubscribe;
  }, [isReady]);
  
  // 실행 취소
  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (history.canUndo()) {
      const undoneItem = history.undo();
      const currentItem = history.getCurrentItem();
      
      if (currentItem && currentItem.data.currentState) {
        // 이전 상태로 이미지 복원
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          renderImage();
        };
        img.src = currentItem.data.currentState;
      }
    }
  }, []);
  
  // 다시 실행
  const handleRedo = useCallback(() => {
    const history = historyRef.current;
    if (history.canRedo()) {
      const redoneItem = history.redo();
      
      if (redoneItem && redoneItem.data.currentState) {
        // 다음 상태로 이미지 복원
        const img = new Image();
        img.onload = () => {
          originalImageRef.current = img;
          renderImage();
        };
        img.src = redoneItem.data.currentState;
      }
    }
  }, []);
  
  return (
    <div className={cn("flex flex-col", className)}>
      {/* 이미지 편집 영역 */}
      <div 
        className="relative flex items-center justify-center border rounded-md overflow-hidden bg-muted/30"
        style={{ width, height, minHeight: 200 }}
      >
        {!isReady ? (
          <div className="animate-pulse h-full w-full bg-muted/20" />
        ) : (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
      
      {/* 편집 도구 */}
      <div className="mt-4">
        <Tabs defaultValue="transform">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transform">변형</TabsTrigger>
            <TabsTrigger value="filter">필터</TabsTrigger>
            <TabsTrigger value="adjust">조정</TabsTrigger>
          </TabsList>
          
          {/* 변형 탭 */}
          <TabsContent value="transform" className="space-y-4 pt-2">
            <div className="flex justify-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRotateLeft}
                title="왼쪽으로 회전"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRotateRight}
                title="오른쪽으로 회전"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleFlipHorizontal}
                title="좌우 뒤집기"
                className={cn(flipX && "bg-primary/10")}
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleFlipVertical}
                title="상하 뒤집기"
                className={cn(flipY && "bg-primary/10")}
              >
                <FlipVertical className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          {/* 필터 탭 */}
          <TabsContent value="filter" className="space-y-4 pt-2">
            <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="필터 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">원본</SelectItem>
                <SelectItem value="grayscale">흑백</SelectItem>
                <SelectItem value="sepia">세피아</SelectItem>
                <SelectItem value="invert">색상 반전</SelectItem>
                <SelectItem value="blur">블러</SelectItem>
              </SelectContent>
            </Select>
          </TabsContent>
          
          {/* 조정 탭 */}
          <TabsContent value="adjust" className="space-y-4 pt-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="brightness">
                    <SunMedium className="h-4 w-4 mr-2 inline-block" />
                    밝기
                  </Label>
                  <span className="text-sm">{brightness}%</span>
                </div>
                <Slider
                  id="brightness"
                  min={0}
                  max={200}
                  step={1}
                  value={[brightness]}
                  onValueChange={handleBrightnessChange}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="contrast">
                    <Contrast className="h-4 w-4 mr-2 inline-block" />
                    대비
                  </Label>
                  <span className="text-sm">{contrast}%</span>
                </div>
                <Slider
                  id="contrast"
                  min={0}
                  max={200}
                  step={1}
                  value={[contrast]}
                  onValueChange={handleContrastChange}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* 히스토리 제어 */}
      <div className="flex justify-center mt-4 gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleUndo}
          disabled={!canUndo}
          title="실행 취소"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleRedo}
          disabled={!canRedo}
          title="다시 실행"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 하단 버튼 */}
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button onClick={handleComplete}>
          <Save className="w-4 h-4 mr-2" />
          저장
        </Button>
      </div>
    </div>
  );
} 