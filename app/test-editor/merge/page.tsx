"use client";

import { useState, useEffect, useRef } from 'react';
import { CanvasMergerPreview } from '@/components/ui/canvas-merger-preview';
import { FabricCanvas, CanvasHelpers } from '@/components/ui/fabric-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Image as ImageIcon, Shapes, Type } from 'lucide-react';

export default function MergeTestPage() {
  const [fabricCanvases, setFabricCanvases] = useState<any[]>([]);
  const [canvasRefs, setCanvasRefs] = useState<any[]>([]);
  const [testImages, setTestImages] = useState<string[]>([
    '/placeholder-1.jpg',
    '/placeholder-2.jpg',
    '/placeholder-3.jpg'
  ]);
  
  // 첫 번째 캔버스에 예시 요소 추가
  const handleCanvasReady = (index: number) => (canvas: any) => {
    // 캔버스 레퍼런스 저장
    setCanvasRefs(prev => {
      const newRefs = [...prev];
      newRefs[index] = canvas;
      return newRefs;
    });
    
    // 첫 번째 캔버스에 예시 요소 추가
    if (index === 0) {
      setTimeout(async () => {
        await CanvasHelpers.addText(canvas, { 
          text: '텍스트 요소 예시', 
          left: 50, 
          top: 50,
          fontSize: 24,
          fill: '#3366cc'
        });
        
        await CanvasHelpers.addShape(canvas, 'rect', {
          left: 50,
          top: 120,
          width: 100,
          height: 80,
          fill: '#66cc99'
        });
      }, 100);
    }
    
    // 두 번째 캔버스에 도형 요소 추가
    if (index === 1) {
      setTimeout(async () => {
        await CanvasHelpers.addShape(canvas, 'circle', {
          left: 80,
          top: 80,
          width: 160,
          height: 160,
          fill: '#cc6666'
        });
        
        await CanvasHelpers.addShape(canvas, 'triangle', {
          left: 250,
          top: 80,
          width: 100,
          height: 100,
          fill: '#6666cc'
        });
      }, 100);
    }
    
    // Fabric 캔버스 목록 업데이트
    setFabricCanvases(prev => {
      const newCanvases = [...prev];
      newCanvases[index] = canvas;
      return newCanvases;
    });
  };
  
  // 새 캔버스 추가
  const addCanvas = () => {
    setFabricCanvases(prev => [...prev, null]);
  };
  
  // 캔버스에 요소 추가 (툴바 버튼용)
  const addElement = async (canvasIndex: number, type: 'text' | 'shape' | 'image') => {
    const canvas = canvasRefs[canvasIndex];
    if (!canvas) return;
    
    switch (type) {
      case 'text':
        await CanvasHelpers.addText(canvas, { 
          text: '새 텍스트', 
          left: 150, 
          top: 150,
          fontSize: 20,
          fill: '#000000'
        });
        break;
      case 'shape':
        const shapes = ['rect', 'circle', 'triangle'];
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)] as 'rect' | 'circle' | 'triangle';
        const colors = ['#ff6666', '#66ff66', '#6666ff', '#ffff66', '#ff66ff', '#66ffff'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        await CanvasHelpers.addShape(canvas, randomShape, {
          left: 150,
          top: 150,
          width: 80,
          height: 80,
          fill: randomColor
        });
        break;
      case 'image':
        const placeholderUrl = `/placeholder-${Math.floor(Math.random() * 3) + 1}.jpg`;
        await CanvasHelpers.addImage(canvas, placeholderUrl, {
          left: 150,
          top: 150
        });
        break;
    }
  };
  
  // 이미지 내보내기 핸들러
  const handleExport = (dataUrl: string) => {
    // 이미지 미리보기 (또는 다운로드)
    const link = document.createElement('a');
    link.download = `merged-canvas-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">캔버스 병합 테스트</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="canvases" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="canvases">캔버스 편집</TabsTrigger>
              <TabsTrigger value="merged">병합 결과</TabsTrigger>
            </TabsList>
            
            <TabsContent value="canvases" className="mt-4">
              <div className="space-y-6">
                {fabricCanvases.map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="p-4 bg-muted/20">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">캔버스 {index + 1}</CardTitle>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => addElement(index, 'text')}
                          >
                            <Type className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => addElement(index, 'shape')}
                          >
                            <Shapes className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => addElement(index, 'image')}
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <FabricCanvas 
                        width={600} 
                        height={300} 
                        onReady={handleCanvasReady(index)} 
                      />
                    </CardContent>
                  </Card>
                ))}
                
                <Button 
                  variant="outline" 
                  className="w-full py-8 border-dashed flex items-center justify-center gap-2"
                  onClick={addCanvas}
                >
                  <PlusCircle className="h-5 w-5" />
                  새 캔버스 추가
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="merged" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>병합 미리보기</CardTitle>
                  <CardDescription>
                    캔버스를 하나의 이미지로 병합하고 다양한 설정을 적용해보세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CanvasMergerPreview 
                    fabricCanvases={fabricCanvases.filter(Boolean)} 
                    imageUrls={testImages}
                    onExport={handleExport}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>사용 방법</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">1. 캔버스 준비</h3>
                <p className="text-sm text-muted-foreground">
                  좌측의 캔버스 편집기에서 여러 캔버스를 생성하고 각각 내용을 추가하세요.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">2. 병합 설정</h3>
                <p className="text-sm text-muted-foreground">
                  병합 결과 탭에서 방향, 간격, 배경색 등 다양한 설정을 조정할 수 있습니다.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">3. 섹션 분할</h3>
                <p className="text-sm text-muted-foreground">
                  병합된 이미지에서 특정 영역만 선택하여 별도로 내보낼 수 있습니다.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium">4. 내보내기</h3>
                <p className="text-sm text-muted-foreground">
                  PNG 또는 JPEG 형식으로 이미지를 내보낼 수 있으며, JPEG의 경우 품질을 조정할 수 있습니다.
                </p>
              </div>
              
              <div className="pt-4">
                <h3 className="font-medium text-primary">테스트 환경</h3>
                <p className="text-sm text-muted-foreground">
                  이 페이지는 캔버스 병합 기능을 테스트하기 위한 환경입니다. 실제 애플리케이션에서는 사용자가 만든 컨텐츠를 병합하여 최종 이미지로 내보낼 수 있습니다.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 