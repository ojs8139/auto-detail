"use client";

import { useState, useRef } from 'react';
import { HiResPreview } from '@/components/ui/hi-res-preview';
import { FabricCanvas } from '@/components/ui/fabric-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image as ImageIcon, Shapes, Type } from 'lucide-react';

export default function HiResTestPage() {
  const [canvas, setCanvas] = useState<any>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('/placeholder-1.jpg');
  const [canvasReady, setCanvasReady] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 캔버스 초기화
  const handleCanvasReady = (fabricCanvas: any) => {
    setCanvas(fabricCanvas);
    setCanvasReady(true);
    
    // 기본 예시 요소 추가
    addSampleText(fabricCanvas);
    addSampleImage(fabricCanvas);
    addSampleShape(fabricCanvas);
  };
  
  // 샘플 텍스트 추가
  const addSampleText = (fabricCanvas: any) => {
    const fabric = (window as any).fabric;
    if (!fabric) return;
    
    const text = new fabric.Textbox('고해상도 텍스트 예제', {
      left: 50,
      top: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333333',
      width: 300
    });
    
    fabricCanvas.add(text);
    fabricCanvas.renderAll();
  };
  
  // 샘플 이미지 추가
  const addSampleImage = (fabricCanvas: any) => {
    const fabric = (window as any).fabric;
    if (!fabric) return;
    
    fabric.Image.fromURL('/placeholder-1.jpg', (img: any) => {
      // 이미지 크기 조정
      const scale = 200 / img.width;
      img.scale(scale);
      img.set({
        left: 400,
        top: 50
      });
      
      fabricCanvas.add(img);
      fabricCanvas.renderAll();
    });
  };
  
  // 샘플 도형 추가
  const addSampleShape = (fabricCanvas: any) => {
    const fabric = (window as any).fabric;
    if (!fabric) return;
    
    // 사각형
    const rect = new fabric.Rect({
      left: 50,
      top: 150,
      width: 100,
      height: 80,
      fill: '#6366f1',
      rx: 8,
      ry: 8
    });
    
    // 원
    const circle = new fabric.Circle({
      left: 200,
      top: 150,
      radius: 50,
      fill: '#ec4899'
    });
    
    // 삼각형
    const triangle = new fabric.Triangle({
      left: 350,
      top: 150,
      width: 100,
      height: 100,
      fill: '#10b981'
    });
    
    fabricCanvas.add(rect, circle, triangle);
    fabricCanvas.renderAll();
  };
  
  // 텍스트 추가
  const handleAddText = () => {
    if (!canvas) return;
    
    const fabric = (window as any).fabric;
    if (!fabric) return;
    
    const text = new fabric.Textbox('텍스트를 편집하세요', {
      left: 100,
      top: 100,
      fontSize: 20,
      fontFamily: 'Arial',
      fill: '#000000',
      width: 250
    });
    
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };
  
  // 이미지 업로드
  const handleAddImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 이미지 파일 처리
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const fabric = (window as any).fabric;
      if (!fabric || !event.target) return;
      
      const dataUrl = event.target.result as string;
      
      fabric.Image.fromURL(dataUrl, (img: any) => {
        // 이미지 크기 조정
        const maxSize = 300;
        const scale = img.width > img.height 
          ? maxSize / img.width 
          : maxSize / img.height;
          
        img.scale(scale);
        img.set({
          left: 100,
          top: 100
        });
        
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        
        // 선택된 이미지 URL 업데이트
        setSelectedImageUrl(dataUrl);
      });
    };
    
    reader.readAsDataURL(file);
    
    // 파일 입력 초기화
    e.target.value = '';
  };
  
  // 도형 추가
  const handleAddShape = () => {
    if (!canvas) return;
    
    const fabric = (window as any).fabric;
    if (!fabric) return;
    
    // 랜덤 도형 생성
    const shapes = [
      () => new fabric.Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 80,
        fill: getRandomColor(),
        rx: 8,
        ry: 8
      }),
      () => new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: getRandomColor()
      }),
      () => new fabric.Triangle({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: getRandomColor()
      })
    ];
    
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)]();
    canvas.add(randomShape);
    canvas.setActiveObject(randomShape);
    canvas.renderAll();
  };
  
  // 랜덤 색상 생성
  const getRandomColor = () => {
    const colors = [
      '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444',
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#64748b'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // 이미지 내보내기 처리
  const handleExport = (dataUrl: string) => {
    console.log('고해상도 이미지 내보내기 완료:', dataUrl.substring(0, 50) + '...');
    
    // 다운로드 링크 생성
    const link = document.createElement('a');
    link.download = `hi-res-output-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-2xl font-bold">고해상도 이미지 생성 테스트</h1>
          <p className="text-muted-foreground mt-2">
            캔버스 요소를 편집하고 고해상도 이미지로 변환해보세요.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>캔버스 편집</CardTitle>
              <CardDescription>
                편집 가능한 캔버스에 요소를 추가하고 배치하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden mb-4">
                <FabricCanvas 
                  width={600} 
                  height={400} 
                  onReady={handleCanvasReady}
                  className="w-full h-auto bg-white"
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddText}
                  className="flex items-center gap-1"
                >
                  <Type className="w-4 h-4 mr-1" />
                  텍스트 추가
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddImage}
                  className="flex items-center gap-1"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  이미지 추가
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddShape}
                  className="flex items-center gap-1"
                >
                  <Shapes className="w-4 h-4 mr-1" />
                  도형 추가
                </Button>
              </div>
              
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>고해상도 변환</CardTitle>
              <CardDescription>
                캔버스 내용을 고해상도 이미지로 변환하고 내보내세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="canvas">
                <TabsList className="mb-4">
                  <TabsTrigger value="canvas">캔버스 변환</TabsTrigger>
                  <TabsTrigger value="image">이미지 변환</TabsTrigger>
                </TabsList>
                
                <TabsContent value="canvas">
                  {canvasReady ? (
                    <HiResPreview
                      canvasElement={canvas ? canvas.lowerCanvasEl : undefined}
                      onExport={handleExport}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 border rounded-md">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">캔버스 로드 중...</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="image">
                  <HiResPreview
                    imageUrl={selectedImageUrl}
                    onExport={handleExport}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 