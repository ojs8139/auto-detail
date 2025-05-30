"use client";

import { useState } from 'react';
import { EditorCanvas } from "@/components/ui/editor-canvas";
import { CanvasPreview } from "@/components/ui/canvas-preview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestEditorPage() {
  const [activeTab, setActiveTab] = useState<string>("classic");
  
  // 기본 요소 샘플
  const defaultElements = [
    {
      type: 'text' as const,
      options: {
        text: '샘플 텍스트 헤더',
        left: 100,
        top: 50,
        fontSize: 30,
        fontWeight: 'bold',
        fill: '#333333'
      }
    },
    {
      type: 'text' as const,
      options: {
        text: '여기에 제품 설명을 추가하세요. 이 텍스트는 수정 가능합니다.',
        left: 100,
        top: 100,
        width: 400,
        fontSize: 16,
        fill: '#666666'
      }
    },
    {
      type: 'shape' as const,
      options: {
        shape: 'rect' as const,
        left: 100,
        top: 200,
        width: 500,
        height: 200,
        fill: '#f0f0f0',
        stroke: '#dddddd',
        strokeWidth: 1
      }
    }
  ];

  return (
    <div className="container py-8 mb-16">
      <h1 className="text-3xl font-bold mb-6">에디터 테스트</h1>
      <p className="text-muted-foreground mb-6">
        드래그 앤 드롭으로 요소를 추가하고, 크기 조절 및 회전이 가능한 에디터 테스트 페이지입니다.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="classic">기존 에디터</TabsTrigger>
          <TabsTrigger value="fabric">Fabric.js 캔버스</TabsTrigger>
        </TabsList>
        
        <TabsContent value="classic" className="mt-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">기존 에디터 사용 방법</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>상단 툴바에서 텍스트나 이미지 요소를 드래그하여 캔버스에 추가합니다.</li>
              <li>요소의 모서리를 드래그하여 크기를 조절할 수 있습니다.</li>
              <li>요소 상단의 원형 핸들을 드래그하여 회전할 수 있습니다.</li>
              <li>캔버스에서 드래그하여 여러 요소를 한 번에 선택할 수 있습니다.</li>
              <li>Delete 키를 눌러 선택한 요소를 삭제할 수 있습니다.</li>
            </ul>
          </div>
          
          <EditorCanvas />
        </TabsContent>
        
        <TabsContent value="fabric" className="mt-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Fabric.js 캔버스 사용 방법</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>캔버스는 Fabric.js 라이브러리를 사용하여 구현되었습니다.</li>
              <li>캔버스에서 요소를 클릭하여 선택하고, 드래그하여 이동할 수 있습니다.</li>
              <li>요소의 테두리 핸들을 드래그하여 크기를 조절할 수 있습니다.</li>
              <li><strong>디바이스 미리보기</strong> 탭에서 다양한 디바이스에서의 렌더링 결과를 확인할 수 있습니다.</li>
              <li>내보내기 버튼을 클릭하여 PNG 또는 JPEG 형식으로 이미지를 다운로드할 수 있습니다.</li>
            </ul>
          </div>
          
          <div className="border rounded-lg shadow-sm p-6 bg-card">
            <CanvasPreview 
              width={800} 
              height={500}
              defaultElements={defaultElements}
            />
          </div>
          
          <div className="mt-8 p-4 bg-muted/30 rounded-md">
            <h3 className="text-lg font-medium mb-2">새롭게 구현된 기능</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>디바이스 미리보기</strong>: 데스크톱, 태블릿, 모바일 등 다양한 디바이스 해상도에서 결과물을 확인할 수 있습니다.</li>
              <li><strong>실시간 캔버스 렌더링</strong>: 캔버스 요소를 수정하면 즉시 렌더링 결과가 업데이트됩니다.</li>
              <li><strong>다양한 내보내기 옵션</strong>: PNG 또는 JPEG 형식으로 결과물을 내보낼 수 있습니다.</li>
              <li><strong>확장 가능한 구조</strong>: 향후 더 많은 요소 타입과 스타일링 옵션을 추가할 수 있는 유연한 구조로 설계되었습니다.</li>
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 