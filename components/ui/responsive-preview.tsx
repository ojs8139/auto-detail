"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { DevicePreviewFrame, DevicePreset, devicePresets } from './device-preview-frame';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Button } from './button';
import { Code, Monitor, Smartphone, Tablet, Laptop, Maximize, Minimize } from 'lucide-react';

// 반응형 브레이크포인트 정의
export interface Breakpoint {
  id: string;
  name: string;
  minWidth: number;
  icon?: React.ReactNode;
}

// 기본 브레이크포인트
export const defaultBreakpoints: Breakpoint[] = [
  { id: 'xs', name: 'Extra Small', minWidth: 0, icon: <Smartphone className="w-4 h-4" /> },
  { id: 'sm', name: 'Small', minWidth: 640, icon: <Smartphone className="w-4 h-4" /> },
  { id: 'md', name: 'Medium', minWidth: 768, icon: <Tablet className="w-4 h-4" /> },
  { id: 'lg', name: 'Large', minWidth: 1024, icon: <Laptop className="w-4 h-4" /> },
  { id: 'xl', name: 'Extra Large', minWidth: 1280, icon: <Monitor className="w-4 h-4" /> },
  { id: '2xl', name: '2X Large', minWidth: 1536, icon: <Maximize className="w-4 h-4" /> }
];

interface ResponsivePreviewProps {
  children?: React.ReactNode;
  className?: string;
  iframeUrl?: string; // 외부 URL로 프리뷰할 경우
  defaultDeviceId?: string;
  cssBreakpoints?: Breakpoint[];
}

export function ResponsivePreview({
  children,
  className,
  iframeUrl,
  defaultDeviceId = 'desktop',
  cssBreakpoints = defaultBreakpoints
}: ResponsivePreviewProps) {
  const [activeDevice, setActiveDevice] = useState<DevicePreset>(
    devicePresets.find(d => d.id === defaultDeviceId) || devicePresets[0]
  );
  const [activeTab, setActiveTab] = useState<string>("device");
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint | null>(null);
  const [cssMode, setCssMode] = useState<'device' | 'breakpoint' | 'resize'>('device');
  const [customWidth, setCustomWidth] = useState<number>(activeDevice.width);
  const resizeStartRef = useRef<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // 디바이스 변경 핸들러
  const handleDeviceChange = useCallback((device: DevicePreset) => {
    setActiveDevice(device);
    setCustomWidth(device.width);
    setCssMode('device');
    setActiveBreakpoint(null);
  }, []);

  // 브레이크포인트 변경 핸들러
  const handleBreakpointChange = useCallback((breakpoint: Breakpoint) => {
    setActiveBreakpoint(breakpoint);
    setCustomWidth(breakpoint.minWidth);
    setCssMode('breakpoint');
  }, []);

  // 현재 활성화된 브레이크포인트 계산
  const getActiveBreakpoint = useCallback((width: number): Breakpoint | null => {
    let activeBreak: Breakpoint | null = null;
    
    // 너비에 맞는 가장 큰 브레이크포인트 찾기
    for (const breakpoint of cssBreakpoints) {
      if (width >= breakpoint.minWidth) {
        if (!activeBreak || breakpoint.minWidth > activeBreak.minWidth) {
          activeBreak = breakpoint;
        }
      }
    }
    
    return activeBreak;
  }, [cssBreakpoints]);

  // 리사이즈 시작 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = e.clientX;
    setCssMode('resize');
  }, []);

  // 리사이즈 중 핸들러
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (isResizing && resizeStartRef.current !== null) {
        const diff = e.clientX - resizeStartRef.current;
        const newWidth = Math.max(320, customWidth + diff);
        setCustomWidth(newWidth);
        resizeStartRef.current = e.clientX;
        
        // 브레이크포인트 계산
        const breakpoint = getActiveBreakpoint(newWidth);
        setActiveBreakpoint(breakpoint);
      }
    };

    const handleResizeEnd = () => {
      if (isResizing) {
        setIsResizing(false);
        resizeStartRef.current = null;
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, customWidth, getActiveBreakpoint]);

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="device">디바이스 미리보기</TabsTrigger>
          <TabsTrigger value="responsive">반응형 테스트</TabsTrigger>
        </TabsList>
        
        <TabsContent value="device" className="mt-4">
          <DevicePreviewFrame
            defaultDeviceId={activeDevice.id}
            onDeviceChange={handleDeviceChange}
            className="w-full"
          >
            {iframeUrl ? (
              <iframe 
                src={iframeUrl} 
                className="w-full h-full border-none"
                title="Responsive Preview"
              />
            ) : (
              children
            )}
          </DevicePreviewFrame>
        </TabsContent>
        
        <TabsContent value="responsive" className="mt-4">
          <div className="flex flex-col space-y-4">
            {/* 브레이크포인트 컨트롤 */}
            <div className="flex flex-wrap gap-2 mb-4">
              {cssBreakpoints.map((breakpoint) => (
                <button
                  key={breakpoint.id}
                  onClick={() => handleBreakpointChange(breakpoint)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md border flex items-center gap-1.5",
                    activeBreakpoint?.id === breakpoint.id && cssMode === 'breakpoint'
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted",
                    customWidth >= breakpoint.minWidth && "border-primary"
                  )}
                >
                  {breakpoint.icon}
                  <span>{breakpoint.name}</span>
                  <span className="text-xs opacity-70">{breakpoint.minWidth}px+</span>
                </button>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={() => {
                  setCssMode('resize');
                  setActiveBreakpoint(null);
                }}
              >
                <Maximize className="w-4 h-4 mr-1" />
                리사이즈 모드
              </Button>
            </div>
            
            {/* 반응형 미리보기 프레임 */}
            <div className="relative bg-muted/30 rounded-lg p-4 overflow-auto">
              <div className="flex justify-center">
                <div 
                  ref={previewRef}
                  className="relative bg-background border shadow-lg overflow-hidden flex flex-col"
                  style={{
                    width: `${customWidth}px`,
                    height: '600px',
                    maxWidth: '100%'
                  }}
                >
                  {/* 상단 브레이크포인트 표시 */}
                  <div className="bg-muted px-3 py-1 flex items-center justify-between text-sm border-b">
                    <div className="flex items-center gap-1.5">
                      {activeBreakpoint?.icon}
                      <span>{activeBreakpoint?.name || '사용자 정의'}</span>
                    </div>
                    <div className="flex items-center">
                      <span>{customWidth}px</span>
                      <Code className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                    </div>
                  </div>
                  
                  {/* 컨텐츠 영역 */}
                  <div className="flex-1 overflow-auto">
                    {iframeUrl ? (
                      <iframe 
                        src={iframeUrl} 
                        className="w-full h-full border-none"
                        title="Responsive Preview"
                      />
                    ) : (
                      children
                    )}
                  </div>
                  
                  {/* 리사이즈 핸들 */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center hover:bg-primary/10"
                    onMouseDown={handleResizeStart}
                  >
                    <div className="w-1 h-8 bg-muted-foreground/40 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* 브레이크포인트 표시 */}
              <div className="relative h-6 mt-4 mx-auto" style={{ width: `${Math.min(customWidth, previewRef.current?.offsetWidth || customWidth)}px` }}>
                {cssBreakpoints.map((breakpoint, index) => {
                  // 표시할 너비 계산 (현재 미리보기 영역에 맞게 비례 조정)
                  const displayWidth = (previewRef.current?.offsetWidth || customWidth) * (breakpoint.minWidth / customWidth);
                  
                  // 현재 뷰포트 너비보다 작은 브레이크포인트만 표시
                  if (breakpoint.minWidth > customWidth || displayWidth > (previewRef.current?.offsetWidth || customWidth)) {
                    return null;
                  }
                  
                  return (
                    <div 
                      key={breakpoint.id}
                      className={cn(
                        "absolute bottom-0 border-l border-dashed flex flex-col items-center", 
                        customWidth >= breakpoint.minWidth ? "border-primary" : "border-muted-foreground/30"
                      )}
                      style={{ 
                        left: `${(breakpoint.minWidth / customWidth) * 100}%`
                      }}
                    >
                      <div className="text-[10px] mb-1 opacity-70 whitespace-nowrap">{breakpoint.minWidth}px</div>
                      <div className="h-2 w-1 bg-current rounded-full"></div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 반응형 표시기 */}
            <div className="bg-muted/30 p-3 rounded-md">
              <div className="text-sm font-medium mb-2">현재 활성화된 CSS 미디어 쿼리:</div>
              <div className="flex flex-wrap gap-2">
                {cssBreakpoints.map(breakpoint => (
                  <div 
                    key={breakpoint.id}
                    className={cn(
                      "px-2 py-1 text-xs rounded-md border flex items-center gap-1.5",
                      customWidth >= breakpoint.minWidth
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                    )}
                  >
                    {breakpoint.icon}
                    <span>@media (min-width: {breakpoint.minWidth}px)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 