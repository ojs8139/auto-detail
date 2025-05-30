"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "./checkbox";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Slider } from "./slider";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Card, CardContent } from "./card";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Badge } from "./badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";
import { Switch } from "./switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { RefreshCw, Info, Save, RotateCcw, Eye, Sparkles, Zap } from "lucide-react";
import type { RegenerationOptions, TextStyleType, ImageStyleType } from "@/lib/regeneration-service";
import { cn } from "@/lib/utils";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  options: RegenerationOptions;
}

export interface RegenerationOptionsProps {
  /**
   * 요소 타입
   */
  elementType: 'text' | 'image' | 'shape';
  
  /**
   * 초기 옵션 값
   */
  initialOptions?: RegenerationOptions;
  
  /**
   * 옵션 변경 시 호출되는 콜백
   */
  onOptionsChange?: (options: RegenerationOptions) => void;
  
  /**
   * 재생성 실행 시 호출되는 콜백
   */
  onRegenerate?: () => void;
  
  /**
   * 미리보기 토글 시 호출되는 콜백
   */
  onPreviewToggle?: (enabled: boolean) => void;
  
  /**
   * 프리셋 목록
   */
  presets?: StylePreset[];
  
  /**
   * 커스텀 CSS 클래스
   */
  className?: string;
}

/**
 * 재생성 옵션 UI 컴포넌트
 */
export function RegenerationOptions({
  elementType,
  initialOptions = {},
  onOptionsChange,
  onRegenerate,
  onPreviewToggle,
  presets: externalPresets,
  className,
}: RegenerationOptionsProps) {
  // 상태 관리
  const [options, setOptions] = useState<RegenerationOptions>(initialOptions);
  const [showPreview, setShowPreview] = useState(false);
  const [customIntensity, setCustomIntensity] = useState(50); // 스타일 적용 강도 (0-100)
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 텍스트 스타일 프리셋
  const textPresets: StylePreset[] = useMemo(() => [
    {
      id: 'informative-preset',
      name: '정보 중심',
      description: '명확하고 직접적인 정보 전달에 최적화',
      options: {
        style: 'informative',
        preserveKeywords: true,
        preserveLength: true
      }
    },
    {
      id: 'persuasive-preset',
      name: '설득력 강화',
      description: '독자의 행동을 유도하는 설득력 있는 텍스트',
      options: {
        style: 'persuasive',
        preserveKeywords: true
      }
    },
    {
      id: 'creative-preset',
      name: '창의적 표현',
      description: '감성적이고 창의적인 표현으로 변환',
      options: {
        style: 'emotional',
        preserveFormat: true
      }
    }
  ], []);
  
  // 이미지 스타일 프리셋
  const imagePresets: StylePreset[] = useMemo(() => [
    {
      id: 'photorealistic-preset',
      name: '사실적 사진',
      description: '자연스럽고 사실적인 사진 스타일',
      options: {
        style: 'photo',
        preserveContext: true
      }
    },
    {
      id: 'artistic-preset',
      name: '예술적 일러스트',
      description: '예술적인 일러스트레이션 스타일',
      options: {
        style: 'illustration'
      }
    },
    {
      id: 'minimal-preset',
      name: '미니멀 디자인',
      description: '간결하고 심플한 미니멀 스타일',
      options: {
        style: 'minimalist'
      }
    }
  ], []);
  
  // 현재 요소 타입에 맞는 프리셋 선택
  const currentPresets = useMemo(() => {
    if (externalPresets && externalPresets.length > 0) {
      return externalPresets;
    }
    
    return elementType === 'text' ? textPresets : imagePresets;
  }, [elementType, externalPresets, textPresets, imagePresets]);
  
  // 초기 옵션이 변경되면 상태 업데이트
  useEffect(() => {
    setOptions(initialOptions);
  }, [initialOptions]);
  
  // 옵션 업데이트 함수
  const updateOptions = (key: keyof RegenerationOptions, value: any) => {
    const newOptions = {
      ...options,
      [key]: value,
    };
    setOptions(newOptions);
    onOptionsChange?.(newOptions);
  };
  
  // 스타일 옵션 변경 핸들러
  const handleStyleChange = (value: string) => {
    updateOptions('style', value);
  };
  
  // 체크박스 상태 변경 핸들러
  const handleCheckboxChange = (key: keyof RegenerationOptions) => (checked: boolean) => {
    updateOptions(key, checked);
  };
  
  // 스타일 강도 변경 핸들러
  const handleIntensityChange = (value: number[]) => {
    setCustomIntensity(value[0]);
    updateOptions('styleIntensity', value[0] / 100);
  };
  
  // 프리셋 적용 핸들러
  const applyPreset = (preset: StylePreset) => {
    setOptions({...preset.options});
    onOptionsChange?.({...preset.options});
  };
  
  // 리셋 핸들러
  const handleReset = () => {
    setOptions({});
    setCustomIntensity(50);
    onOptionsChange?.({});
  };
  
  // 미리보기 토글 핸들러
  const handlePreviewToggle = (checked: boolean) => {
    setShowPreview(checked);
    onPreviewToggle?.(checked);
  };
  
  // 미리보기 상태에 따른 버튼 텍스트 변경
  const regenerateButtonText = useMemo(() => {
    if (showPreview) {
      return elementType === 'text' ? '텍스트 미리보기 생성' : '이미지 미리보기 생성';
    }
    return elementType === 'text' ? '텍스트 재생성' : '이미지 재생성';
  }, [showPreview, elementType]);
  
  return (
    <div className={cn("p-4 border rounded-md overflow-hidden", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">재생성 옵션</h3>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="sr-only">초기화</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>옵션 초기화</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onPreviewToggle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-1">
                    <Label htmlFor="preview-mode" className="text-xs">미리보기</Label>
                    <Switch
                      id="preview-mode"
                      checked={showPreview}
                      onCheckedChange={handlePreviewToggle}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>변경 사항 미리보기 모드</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      {/* 프리셋 선택 */}
      <div className="mb-4">
        <Label className="text-sm mb-1 block">프리셋</Label>
        <div className="grid grid-cols-3 gap-2">
          {currentPresets.map((preset) => (
            <Card 
              key={preset.id}
              className={cn(
                "cursor-pointer hover:border-primary/50 transition-colors", 
                JSON.stringify(options) === JSON.stringify(preset.options) && "border-primary"
              )}
              onClick={() => applyPreset(preset)}
            >
              <CardContent className="p-2">
                <div className="flex flex-col items-center justify-center text-center">
                  <Sparkles className="h-4 w-4 mb-1 text-muted-foreground" />
                  <span className="text-xs font-medium">{preset.name}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 mt-1 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{preset.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="basic">기본 옵션</TabsTrigger>
          <TabsTrigger value="advanced">고급 옵션</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4 mt-2">
          {/* 요소 타입에 따른 스타일 선택 */}
          <div className="space-y-2">
            <Label htmlFor="style">스타일</Label>
            <Select 
              value={options.style as string || 'default'} 
              onValueChange={handleStyleChange}
            >
              <SelectTrigger id="style">
                <SelectValue placeholder="스타일 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">기본</SelectItem>
                
                {elementType === 'text' && (
                  <>
                    <SelectItem value="informative">정보 제공형</SelectItem>
                    <SelectItem value="persuasive">설득형</SelectItem>
                    <SelectItem value="emotional">감성적</SelectItem>
                    <SelectItem value="technical">기술적</SelectItem>
                    <SelectItem value="narrative">이야기형</SelectItem>
                  </>
                )}
                
                {elementType === 'image' && (
                  <>
                    <SelectItem value="photo">사진형</SelectItem>
                    <SelectItem value="illustration">일러스트</SelectItem>
                    <SelectItem value="graphic">그래픽</SelectItem>
                    <SelectItem value="minimalist">미니멀</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* 스타일 강도 슬라이더 */}
          {options.style && options.style !== 'default' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="intensity">스타일 강도</Label>
                <span className="text-xs text-muted-foreground">{customIntensity}%</span>
              </div>
              <Slider
                id="intensity"
                min={0}
                max={100}
                step={1}
                value={[customIntensity]}
                onValueChange={handleIntensityChange}
              />
            </div>
          )}
          
          {/* 텍스트 요소일 경우의 추가 옵션 */}
          {elementType === 'text' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preserveFormat" 
                  checked={options.preserveFormat || false}
                  onCheckedChange={handleCheckboxChange('preserveFormat')}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="preserveFormat" className="font-medium">서식 유지</Label>
                  <p className="text-[0.8rem] text-muted-foreground">원본 텍스트의 형식과 구조를 유지합니다</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preserveLength" 
                  checked={options.preserveLength || false}
                  onCheckedChange={handleCheckboxChange('preserveLength')}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="preserveLength" className="font-medium">길이 유지</Label>
                  <p className="text-[0.8rem] text-muted-foreground">원본 텍스트와 비슷한 길이로 생성합니다</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preserveKeywords" 
                  checked={options.preserveKeywords || false}
                  onCheckedChange={handleCheckboxChange('preserveKeywords')}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="preserveKeywords" className="font-medium">핵심 키워드 유지</Label>
                  <p className="text-[0.8rem] text-muted-foreground">원본 텍스트의 주요 키워드를 보존합니다</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 이미지 요소일 경우의 추가 옵션 */}
          {elementType === 'image' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preserveContext" 
                  checked={options.preserveContext || false}
                  onCheckedChange={handleCheckboxChange('preserveContext')}
                />
                <div className="grid gap-0.5">
                  <Label htmlFor="preserveContext" className="font-medium">컨텍스트 유지</Label>
                  <p className="text-[0.8rem] text-muted-foreground">원본 이미지의 주요 요소와 구성을 유지합니다</p>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-4 mt-2">
          <Accordion type="single" collapsible>
            {/* 텍스트 요소일 경우의 고급 옵션 */}
            {elementType === 'text' && (
              <>
                <AccordionItem value="tone">
                  <AccordionTrigger>톤 & 스타일 세부 조정</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="toneConsistency" 
                          checked={options.toneConsistency || false}
                          onCheckedChange={handleCheckboxChange('toneConsistency')}
                        />
                        <Label htmlFor="toneConsistency">어조 일관성 유지</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="enhanceClarity" 
                          checked={options.enhanceClarity || false}
                          onCheckedChange={handleCheckboxChange('enhanceClarity')}
                        />
                        <Label htmlFor="enhanceClarity">명확성 향상</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="structure">
                  <AccordionTrigger>구조 & 서식</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preserveParagraphs" 
                          checked={options.preserveParagraphs || false}
                          onCheckedChange={handleCheckboxChange('preserveParagraphs')}
                        />
                        <Label htmlFor="preserveParagraphs">단락 구조 유지</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preserveSentenceStructure" 
                          checked={options.preserveSentenceStructure || false}
                          onCheckedChange={handleCheckboxChange('preserveSentenceStructure')}
                        />
                        <Label htmlFor="preserveSentenceStructure">문장 구조 유지</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
            
            {/* 이미지 요소일 경우의 고급 옵션 */}
            {elementType === 'image' && (
              <>
                <AccordionItem value="composition">
                  <AccordionTrigger>구도 & 배치</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preserveComposition" 
                          checked={options.preserveComposition || false}
                          onCheckedChange={handleCheckboxChange('preserveComposition')}
                        />
                        <Label htmlFor="preserveComposition">구도 유지</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preserveFocalPoint" 
                          checked={options.preserveFocalPoint || false}
                          onCheckedChange={handleCheckboxChange('preserveFocalPoint')}
                        />
                        <Label htmlFor="preserveFocalPoint">주요 초점 유지</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="colors">
                  <AccordionTrigger>색상 & 분위기</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preserveColorPalette" 
                          checked={options.preserveColorPalette || false}
                          onCheckedChange={handleCheckboxChange('preserveColorPalette')}
                        />
                        <Label htmlFor="preserveColorPalette">색상 팔레트 유지</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="preserveMood" 
                          checked={options.preserveMood || false}
                          onCheckedChange={handleCheckboxChange('preserveMood')}
                        />
                        <Label htmlFor="preserveMood">전체적인 분위기 유지</Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </>
            )}
            
            {/* 공통 고급 옵션 */}
            <AccordionItem value="performance">
              <AccordionTrigger>성능 & 품질</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality">생성 품질</Label>
                    <Select 
                      value={options.quality as string || 'standard'}
                      onValueChange={(value) => updateOptions('quality', value)}
                    >
                      <SelectTrigger id="quality" className="w-[180px]">
                        <SelectValue placeholder="품질 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">초안 (빠름)</SelectItem>
                        <SelectItem value="standard">표준</SelectItem>
                        <SelectItem value="high">고품질 (느림)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
      
      {/* 선택된 옵션 요약 표시 */}
      <div className="flex flex-wrap gap-1 mt-4">
        {options.style && options.style !== 'default' && (
          <Badge variant="outline" className="text-xs">
            스타일: {options.style}
          </Badge>
        )}
        {options.styleIntensity && (
          <Badge variant="outline" className="text-xs">
            강도: {Math.round(options.styleIntensity * 100)}%
          </Badge>
        )}
        {options.preserveFormat && (
          <Badge variant="outline" className="text-xs">서식 유지</Badge>
        )}
        {options.preserveLength && (
          <Badge variant="outline" className="text-xs">길이 유지</Badge>
        )}
        {options.preserveKeywords && (
          <Badge variant="outline" className="text-xs">키워드 유지</Badge>
        )}
        {options.preserveContext && (
          <Badge variant="outline" className="text-xs">컨텍스트 유지</Badge>
        )}
        {options.quality && options.quality !== 'standard' && (
          <Badge variant="outline" className="text-xs">
            품질: {options.quality === 'high' ? '고품질' : '초안'}
          </Badge>
        )}
      </div>
      
      {/* 공통 옵션 */}
      <div className="mt-4">
        <Button 
          onClick={onRegenerate} 
          className="w-full flex items-center justify-center"
        >
          {showPreview ? <Eye className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          {regenerateButtonText}
        </Button>
      </div>
    </div>
  );
} 