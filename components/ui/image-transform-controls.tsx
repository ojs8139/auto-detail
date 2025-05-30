"use client";

import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Slider } from "./slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { RotateCw, RotateCcw, FlipHorizontal, Filter, Crop, RefreshCw, Undo } from "lucide-react";

export interface ImageTransformOptions {
  rotate?: number;
  flip?: 'horizontal' | 'vertical' | 'both';
  filter?: 'grayscale' | 'sepia' | 'invert' | 'blur';
  brightness?: number;
  contrast?: number;
  cropArea?: { x: number; y: number; width: number; height: number };
}

export interface ImageTransformControlsProps {
  /**
   * 초기 변형 옵션
   */
  initialOptions?: ImageTransformOptions;
  
  /**
   * 옵션 변경 시 호출되는 콜백
   */
  onOptionsChange?: (options: ImageTransformOptions) => void;
  
  /**
   * 변형 적용 버튼 클릭 시 호출되는 콜백
   */
  onApplyTransform?: (options: ImageTransformOptions) => void;
  
  /**
   * 실행 취소 버튼 클릭 시 호출되는 콜백
   */
  onUndo?: () => void;
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
}

/**
 * 이미지 변형 컨트롤 컴포넌트
 * 회전, 뒤집기, 필터, 밝기/대비 조정 등을 위한 UI 제공
 */
export function ImageTransformControls({
  initialOptions = {},
  onOptionsChange,
  onApplyTransform,
  onUndo,
  className
}: ImageTransformControlsProps) {
  // 변형 옵션 상태
  const [options, setOptions] = useState<ImageTransformOptions>(initialOptions);
  
  // 회전 값 변경 핸들러
  const handleRotateChange = (value: number) => {
    const newOptions = { ...options, rotate: value };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  };
  
  // 회전 버튼 핸들러
  const handleRotateLeft = () => {
    const currentRotate = options.rotate || 0;
    const newRotate = (currentRotate - 90) % 360;
    handleRotateChange(newRotate);
  };
  
  const handleRotateRight = () => {
    const currentRotate = options.rotate || 0;
    const newRotate = (currentRotate + 90) % 360;
    handleRotateChange(newRotate);
  };
  
  // 뒤집기 핸들러
  const handleFlipChange = (value: 'horizontal' | 'vertical' | 'both' | undefined) => {
    const newOptions = { ...options, flip: value };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  };
  
  // 필터 핸들러
  const handleFilterChange = (value: 'grayscale' | 'sepia' | 'invert' | 'blur' | undefined) => {
    const newOptions = { ...options, filter: value };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  };
  
  // 밝기 핸들러
  const handleBrightnessChange = (value: number[]) => {
    const newOptions = { ...options, brightness: value[0] };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  };
  
  // 대비 핸들러
  const handleContrastChange = (value: number[]) => {
    const newOptions = { ...options, contrast: value[0] };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  };
  
  // 변형 적용 핸들러
  const handleApplyTransform = () => {
    onApplyTransform?.(options);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">이미지 변형</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">기본</TabsTrigger>
            <TabsTrigger value="filters">필터</TabsTrigger>
            <TabsTrigger value="adjust">조정</TabsTrigger>
          </TabsList>
          
          {/* 기본 변형 탭 */}
          <TabsContent value="basic" className="space-y-4">
            {/* 회전 컨트롤 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">회전</h3>
              <div className="flex items-center justify-between gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRotateLeft}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  -90°
                </Button>
                <span className="text-sm">{options.rotate || 0}°</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRotateRight}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  +90°
                </Button>
              </div>
            </div>
            
            {/* 뒤집기 컨트롤 */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">뒤집기</h3>
              <Select 
                value={options.flip || "none"} 
                onValueChange={(value) => handleFlipChange(value === "none" ? undefined : value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="뒤집기 옵션 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  <SelectItem value="horizontal">수평</SelectItem>
                  <SelectItem value="vertical">수직</SelectItem>
                  <SelectItem value="both">수평 + 수직</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* 필터 탭 */}
          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">필터 효과</h3>
              <Select 
                value={options.filter || "none"} 
                onValueChange={(value) => handleFilterChange(value === "none" ? undefined : value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="필터 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">없음</SelectItem>
                  <SelectItem value="grayscale">흑백</SelectItem>
                  <SelectItem value="sepia">세피아</SelectItem>
                  <SelectItem value="invert">색상 반전</SelectItem>
                  <SelectItem value="blur">블러</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* 조정 탭 */}
          <TabsContent value="adjust" className="space-y-4">
            {/* 밝기 조정 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">밝기</h3>
                <span className="text-xs text-muted-foreground">{options.brightness || 0}%</span>
              </div>
              <Slider 
                min={-100} 
                max={100} 
                step={1}
                value={[options.brightness || 0]}
                onValueChange={handleBrightnessChange}
              />
            </div>
            
            {/* 대비 조정 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">대비</h3>
                <span className="text-xs text-muted-foreground">{options.contrast || 0}%</span>
              </div>
              <Slider 
                min={-100} 
                max={100} 
                step={1}
                value={[options.contrast || 0]}
                onValueChange={handleContrastChange}
              />
            </div>
          </TabsContent>
        </Tabs>
        
        {/* 액션 버튼 */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onUndo}
          >
            <Undo className="h-4 w-4 mr-1" />
            실행 취소
          </Button>
          
          <Button 
            variant="default" 
            size="sm"
            onClick={handleApplyTransform}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            변경 적용
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 