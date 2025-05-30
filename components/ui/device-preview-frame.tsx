"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Smartphone, Tablet, Monitor, Laptop, RotateCcw } from 'lucide-react';
import { Button } from './button';

// 디바이스 프리셋 정의
export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  scale?: number;
  icon?: React.ReactNode;
}

// 기본 디바이스 프리셋
export const devicePresets: DevicePreset[] = [
  { 
    id: 'desktop', 
    name: '데스크톱', 
    width: 1280, 
    height: 800, 
    scale: 0.7,
    icon: <Monitor className="w-4 h-4 mr-2" />
  },
  { 
    id: 'laptop', 
    name: '노트북', 
    width: 1024, 
    height: 768, 
    scale: 0.8,
    icon: <Laptop className="w-4 h-4 mr-2" />
  },
  { 
    id: 'tablet', 
    name: '태블릿', 
    width: 768, 
    height: 1024, 
    scale: 0.8,
    icon: <Tablet className="w-4 h-4 mr-2" />
  },
  { 
    id: 'mobile', 
    name: '모바일', 
    width: 375, 
    height: 667, 
    scale: 0.9,
    icon: <Smartphone className="w-4 h-4 mr-2" />
  },
  { 
    id: 'custom', 
    name: '사용자 정의', 
    width: 800, 
    height: 600, 
    scale: 1 
  }
];

interface DevicePreviewFrameProps {
  children: React.ReactNode;
  className?: string;
  defaultDeviceId?: string;
  onDeviceChange?: (device: DevicePreset) => void;
}

export function DevicePreviewFrame({
  children,
  className,
  defaultDeviceId = 'desktop',
  onDeviceChange
}: DevicePreviewFrameProps) {
  const [activeDevice, setActiveDevice] = useState<DevicePreset>(
    devicePresets.find(d => d.id === defaultDeviceId) || devicePresets[0]
  );
  const [zoom, setZoom] = useState(activeDevice.scale || 1);
  const [customWidth, setCustomWidth] = useState('800');
  const [customHeight, setCustomHeight] = useState('600');
  const [isLandscape, setIsLandscape] = useState(
    activeDevice.width > activeDevice.height
  );

  // 디바이스 변경 핸들러
  const handleDeviceChange = (deviceId: string) => {
    const device = devicePresets.find(d => d.id === deviceId);
    if (!device) return;

    setActiveDevice(device);
    setZoom(device.scale || 1);
    // 새 디바이스로 변경 시 방향은 디바이스 기본값으로 설정
    setIsLandscape(device.width > device.height);
    
    if (onDeviceChange) {
      onDeviceChange(device);
    }
  };

  // 사용자 정의 크기 적용 핸들러
  const applyCustomSize = () => {
    const width = parseInt(customWidth, 10) || 800;
    const height = parseInt(customHeight, 10) || 600;
    
    const customDevice: DevicePreset = {
      id: 'custom',
      name: '사용자 정의',
      width: isLandscape ? Math.max(width, height) : Math.min(width, height),
      height: isLandscape ? Math.min(width, height) : Math.max(width, height),
      scale: zoom
    };
    
    setActiveDevice(customDevice);
    
    if (onDeviceChange) {
      onDeviceChange(customDevice);
    }
  };

  // 방향 전환 핸들러
  const toggleOrientation = () => {
    const newIsLandscape = !isLandscape;
    setIsLandscape(newIsLandscape);
    
    const newDevice = {
      ...activeDevice,
      width: newIsLandscape ? Math.max(activeDevice.width, activeDevice.height) : Math.min(activeDevice.width, activeDevice.height),
      height: newIsLandscape ? Math.min(activeDevice.width, activeDevice.height) : Math.max(activeDevice.width, activeDevice.height)
    };
    
    setActiveDevice(newDevice);
    
    if (onDeviceChange) {
      onDeviceChange(newDevice);
    }
  };

  // 줌 레벨 변경 핸들러
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setActiveDevice({
      ...activeDevice,
      scale: newZoom
    });
  };

  // 현재 디바이스 크기 계산
  const deviceWidth = isLandscape ? 
    Math.max(activeDevice.width, activeDevice.height) : 
    Math.min(activeDevice.width, activeDevice.height);
    
  const deviceHeight = isLandscape ? 
    Math.min(activeDevice.width, activeDevice.height) : 
    Math.max(activeDevice.width, activeDevice.height);

  return (
    <div className={cn("flex flex-col", className)}>
      {/* 디바이스 선택 컨트롤 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {devicePresets.map((device) => (
          <button
            key={device.id}
            onClick={() => handleDeviceChange(device.id)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md border flex items-center",
              device.id === activeDevice.id
                ? "bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            )}
          >
            {device.icon}
            {device.name}
          </button>
        ))}
      </div>

      {/* 사용자 정의 크기 및 방향 컨트롤 */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {activeDevice.id === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(e.target.value)}
              className="w-20 px-2 py-1 border rounded"
              placeholder="너비"
              min="1"
            />
            <span>×</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(e.target.value)}
              className="w-20 px-2 py-1 border rounded"
              placeholder="높이"
              min="1"
            />
            <button
              onClick={applyCustomSize}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
            >
              적용
            </button>
          </div>
        )}
        
        {/* 방향 전환 버튼 */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleOrientation} 
          className="flex items-center gap-1"
        >
          <RotateCcw className="w-4 h-4" />
          {isLandscape ? '세로 모드' : '가로 모드'}
        </Button>

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm">줌:</span>
          <select
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="px-2 py-1 border rounded bg-background"
          >
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
          </select>
        </div>
      </div>

      {/* 디바이스 프레임 */}
      <div className="relative flex items-center justify-center bg-muted/30 rounded-lg p-8 overflow-auto">
        <div 
          className={cn(
            "relative bg-background border rounded-md shadow-lg overflow-hidden transition-all",
            activeDevice.id === 'mobile' && "rounded-2xl",
            activeDevice.id === 'tablet' && "rounded-xl"
          )}
          style={{
            width: deviceWidth * zoom,
            height: deviceHeight * zoom,
            transform: `scale(${zoom})`,
            transformOrigin: 'center top'
          }}
        >
          {/* 디바이스 상단 UI */}
          {(activeDevice.id === 'mobile' || activeDevice.id === 'tablet') && (
            <div className="w-full h-6 bg-gray-800 flex justify-center items-center">
              <div className="w-16 h-1 bg-gray-600 rounded"></div>
            </div>
          )}
          
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
          
          {/* 디바이스 하단 UI */}
          {activeDevice.id === 'mobile' && (
            <div className="w-full h-4 bg-gray-800 flex justify-center items-center">
              <div className="w-8 h-2 bg-gray-600 rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* 디바이스 정보 표시 */}
        <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs">
          {deviceWidth} × {deviceHeight} ({isLandscape ? '가로' : '세로'})
        </div>
      </div>
    </div>
  );
} 