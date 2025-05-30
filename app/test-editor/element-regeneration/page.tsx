"use client";

import { useState, useEffect, useRef } from "react";
import { ElementSelector } from "@/components/ui/element-selector";
import { ElementRegenerationMenu } from "@/components/ui/context-menu";
import { RegenerationOptions } from "@/components/ui/regeneration-options";
import { RegenerationResult } from "@/components/ui/regeneration-result";
import { ImageTransformControls, type ImageTransformOptions } from "@/components/ui/image-transform-controls";
import { RegenerationService, type RegenerationResult as RegenerationResultType, type RegenerationOptions as RegenerationOptionsType } from "@/lib/regeneration-service";
import { CanvasEngine } from "@/lib/canvas-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Wand2, Undo, History, Type, Image as ImageIcon, Edit, Sliders } from "lucide-react";
import * as fabric from "fabric";
import { HistoryDialog } from "@/components/ui/history-dialog";
import { ConsistencyValidator, ConsistencyValidationResult } from "@/lib/consistency-validator";
import { ConsistencyValidationUI } from "@/components/ui/consistency-validation-result";

export default function ElementRegenerationPage() {
  // 캔버스 엔진 참조
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasEngine, setCanvasEngine] = useState<CanvasEngine | null>(null);
  
  // 재생성 서비스
  const [regenerationService] = useState(() => new RegenerationService());
  
  // 선택된 요소 상태
  const [selectedElement, setSelectedElement] = useState<{
    id: string;
    type: 'text' | 'image' | 'shape';
  } | null>(null);
  
  // 재생성 결과 상태
  const [regenerationResult, setRegenerationResult] = useState<RegenerationResultType | null>(null);
  
  // 재생성 옵션 상태
  const [showOptions, setShowOptions] = useState(false);
  const [regenerationOptions, setRegenerationOptions] = useState<RegenerationOptionsType>({});
  
  // 컨텍스트 메뉴 상태
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [contextMenuElement, setContextMenuElement] = useState<{
    id: string;
    type: 'text' | 'image' | 'shape';
  } | null>(null);
  
  // 이미지 변형 옵션 상태
  const [showImageTransform, setShowImageTransform] = useState(false);
  const [imageTransformOptions, setImageTransformOptions] = useState<ImageTransformOptions>({});
  
  // 미리보기 상태 추가
  const [previewMode, setPreviewMode] = useState(false);
  
  // 히스토리 관련 추가
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [currentElementHistory, setCurrentElementHistory] = useState<RegenerationResultType[]>([]);
  
  // 일관성 검증 validator 및 결과 상태 추가
  const [consistencyValidator] = useState(() => new ConsistencyValidator());
  const [validationResult, setValidationResult] = useState<ConsistencyValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  
  // 초기화 함수
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // 캔버스 엔진 초기화
    const engine = new CanvasEngine(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa'
    });
    setCanvasEngine(engine);
    
    // 샘플 요소 추가
    engine.addText({
      id: 'sample-text-1',
      type: 'text',
      left: 100,
      top: 100,
      text: '샘플 텍스트입니다. 이 텍스트를 선택하여 재생성해 보세요.',
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#333333'
    });
    
    // 샘플 이미지 추가
    engine.addImage({
      id: 'sample-image-1',
      type: 'image',
      left: 500,
      top: 300,
      src: 'https://placehold.co/300x200/2a86db/ffffff?text=Sample+Image',
      width: 300,
      height: 200
    });
    
    // 우클릭 컨텍스트 메뉴 이벤트 설정
    const canvas = engine.getFabricCanvas();
    
    // 우클릭 이벤트 리스너
    canvas.on('mouse:down', (e: fabric.TEvent) => {
      if (!e.e) return;
      const event = e.e as MouseEvent;
      
      // 마우스 오른쪽 버튼 클릭 감지
      if (event.button === 2) {
        event.preventDefault();
        
        // 현재 선택된 객체 확인
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;
        
        // 객체의 ID와 타입 추출
        const data = activeObject.get('data') as { id: string; type: 'text' | 'image' | 'shape' } | undefined;
        if (!data || !data.id || !data.type) return;
        
        // 컨텍스트 메뉴 위치 및 요소 정보 설정
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setContextMenuElement({ id: data.id, type: data.type });
      }
    });
    
    // 브라우저 기본 컨텍스트 메뉴 비활성화
    const canvasElement = canvasRef.current;
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };
    
    canvasElement.addEventListener('contextmenu', handleContextMenu);
    
    // 캔버스 외부 클릭 시 컨텍스트 메뉴 닫기
    const handleClickOutside = () => {
      setContextMenuPosition(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    
    // 정리 함수
    return () => {
      // 이벤트 리스너 제거
      canvasElement.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
      
      // 직접 캔버스 정리
      const fabricCanvas = engine.getFabricCanvas();
      fabricCanvas.dispose();
    };
  }, []);
  
  // 요소 선택 핸들러
  const handleElementSelected = (elementId: string, elementType: 'text' | 'image' | 'shape') => {
    setSelectedElement({ id: elementId, type: elementType });
    setRegenerationResult(null);
    setShowOptions(false);
  };
  
  // 옵션 변경 핸들러
  const handleOptionsChange = (options: RegenerationOptionsType) => {
    setRegenerationOptions(options);
  };
  
  // 텍스트 재생성 핸들러
  const handleRegenerateText = async () => {
    // 현재 컨텍스트 메뉴를 통해 선택된 요소 또는 일반적으로 선택된 요소 사용
    const targetElement = contextMenuElement || selectedElement;
    
    if (!targetElement || !canvasEngine || targetElement.type !== 'text') return;
    
    // 캔버스 객체 가져오기
    const canvas = canvasEngine.getFabricCanvas();
    const objects = canvas.getObjects();
    const textObj = objects.find(obj => {
      const data = obj.get('data') as { id: string } | undefined;
      return data?.id === targetElement.id;
    }) as fabric.Text;
    
    if (!textObj || textObj.type !== 'text') return;
    
    // 텍스트 콘텐츠 가져오기
    const originalText = textObj.text || '';
    
    // 선택된 요소 업데이트
    setSelectedElement(targetElement);
    
    // 컨텍스트 메뉴 닫기
    setContextMenuPosition(null);
    
    // 옵션 UI 표시
    setShowOptions(true);
  };
  
  // 이미지 재생성 핸들러
  const handleRegenerateImage = async () => {
    // 현재 컨텍스트 메뉴를 통해 선택된 요소 또는 일반적으로 선택된 요소 사용
    const targetElement = contextMenuElement || selectedElement;
    
    if (!targetElement || !canvasEngine || targetElement.type !== 'image') return;
    
    // 캔버스 객체 가져오기
    const canvas = canvasEngine.getFabricCanvas();
    const objects = canvas.getObjects();
    const imageObj = objects.find(obj => {
      const data = obj.get('data') as { id: string } | undefined;
      return data?.id === targetElement.id;
    }) as fabric.Image;
    
    if (!imageObj || imageObj.type !== 'image') return;
    
    // 이미지 URL 가져오기
    const originalImageUrl = imageObj.getSrc ? imageObj.getSrc() : '';
    
    // 선택된 요소 업데이트
    setSelectedElement(targetElement);
    
    // 컨텍스트 메뉴 닫기
    setContextMenuPosition(null);
    
    // 옵션 UI 표시
    setShowOptions(true);
  };
  
  // 재생성 실행 핸들러
  const handleExecuteRegeneration = async () => {
    if (!selectedElement || !canvasEngine) return;
    
    // 캔버스 객체 가져오기
    const canvas = canvasEngine.getFabricCanvas();
    const objects = canvas.getObjects();
    const element = objects.find(obj => {
      const data = obj.get('data') as { id: string } | undefined;
      return data?.id === selectedElement.id;
    });
    
    if (!element) return;
    
    if (selectedElement.type === 'text') {
      // 텍스트 콘텐츠 가져오기
      const textObj = element as fabric.Text;
      const originalText = textObj.text || '';
      
      // 텍스트 재생성 실행 - 현재 설정된 옵션 적용
      const result = await regenerationService.regenerateText(
        selectedElement.id, 
        originalText, 
        regenerationOptions
      );
      
      // 결과 설정
      setRegenerationResult(result);
    } else if (selectedElement.type === 'image') {
      // 이미지 URL 가져오기
      const imageObj = element as fabric.Image;
      const originalImageUrl = imageObj.getSrc ? imageObj.getSrc() : '';
      
      // 이미지 재생성 실행 - 현재 설정된 옵션 적용
      const result = await regenerationService.regenerateImage(
        selectedElement.id, 
        originalImageUrl, 
        regenerationOptions
      );
      
      // 결과 설정
      setRegenerationResult(result);
    }
    
    // 일관성 검증
    if (regenerationResult) {
      const validation = consistencyValidator.validate(regenerationResult);
      setValidationResult(validation);
      setShowValidation(true);
    }
    
    // 옵션 UI 숨김
    setShowOptions(false);
  };
  
  // 재생성 결과 적용 핸들러
  const handleApplyResult = (result: RegenerationResultType) => {
    if (!selectedElement || !canvasEngine) return;
    
    if (selectedElement.type === 'text') {
      // 텍스트 업데이트
      canvasEngine.updateItem(selectedElement.id, {
        text: result.newContent
      });
    } else if (selectedElement.type === 'image') {
      // 이미지 교체
      canvasEngine.loadImage(result.newContent).then(newImage => {
        canvasEngine.replaceImage(selectedElement.id, newImage);
      });
    }
    
    // 결과 초기화
    setRegenerationResult(null);
  };
  
  // 재생성 취소 핸들러
  const handleCancelRegeneration = () => {
    setRegenerationResult(null);
  };
  
  // 요소 타입에 따른 아이콘 렌더링
  const renderElementIcon = (type: 'text' | 'image' | 'shape') => {
    switch (type) {
      case 'text':
        return <Type className="mr-2 h-4 w-4" />;
      case 'image':
        return <ImageIcon className="mr-2 h-4 w-4" />;
      case 'shape':
        return <Edit className="mr-2 h-4 w-4" />;
      default:
        return null;
    }
  };
  
  // 이미지 변형 핸들러
  const handleTransformImage = () => {
    if (!selectedElement || !canvasEngine || selectedElement.type !== 'image') return;
    
    // 이미지 변형 UI 표시
    setShowImageTransform(true);
    setShowOptions(false);
  };
  
  // 이미지 변형 옵션 변경 핸들러
  const handleImageTransformOptionsChange = (options: ImageTransformOptions) => {
    setImageTransformOptions(options);
  };
  
  // 이미지 변형 적용 핸들러
  const handleApplyImageTransform = async (options: ImageTransformOptions) => {
    if (!selectedElement || !canvasEngine || selectedElement.type !== 'image') return;
    
    // 캔버스 객체 가져오기
    const canvas = canvasEngine.getFabricCanvas();
    const objects = canvas.getObjects();
    const imageObj = objects.find(obj => {
      const data = obj.get('data') as { id: string } | undefined;
      return data?.id === selectedElement.id;
    }) as fabric.Image;
    
    if (!imageObj || imageObj.type !== 'image') return;
    
    // 이미지 URL 가져오기
    const originalImageUrl = imageObj.getSrc ? imageObj.getSrc() : '';
    
    // 이미지 변형 실행
    const result = await regenerationService.transformImage(
      selectedElement.id,
      originalImageUrl,
      {
        rotate: options.rotate,
        flip: options.flip,
        filter: options.filter,
        brightness: options.brightness,
        contrast: options.contrast
      }
    );
    
    // 결과 설정
    setRegenerationResult(result);
    setShowImageTransform(false);
  };
  
  // 이미지 변형 실행 취소 핸들러
  const handleUndoImageTransform = () => {
    setShowImageTransform(false);
  };
  
  // 미리보기 토글 핸들러
  const handlePreviewToggle = (enabled: boolean) => {
    setPreviewMode(enabled);
    
    // 미리보기 모드가 활성화되면 즉시 재생성 프리뷰 표시
    if (enabled && selectedElement) {
      handleExecuteRegeneration();
    }
  };
  
  // 히스토리 보기 핸들러
  const handleViewHistory = (elementId: string) => {
    const history = regenerationService.getHistory(elementId);
    setCurrentElementHistory(history);
    setShowHistoryDialog(true);
  };
  
  // 롤백 핸들러
  const handleRollback = async (elementId: string, resultId: string) => {
    // 서비스를 통해 롤백 실행
    const result = regenerationService.rollbackToVersion(elementId, resultId);
    
    if (result) {
      // 결과 표시
      setRegenerationResult(result);
      setShowHistoryDialog(false);
      
      // 롤백된 결과 적용
      handleApplyResult(result);
    }
  };
  
  // 실행 취소 핸들러
  const handleUndo = async (elementId: string) => {
    // 서비스를 통해 실행 취소
    const result = regenerationService.undoLastRegeneration(elementId);
    
    if (result) {
      // 결과 표시
      setRegenerationResult(result);
      setShowHistoryDialog(false);
      
      // 취소된 결과 적용
      handleApplyResult(result);
    }
  };
  
  // 히스토리 다이얼로그 상태 변경 핸들러
  const handleHistoryDialogOpenChange = (open: boolean) => {
    setShowHistoryDialog(open);
    
    // 다이얼로그가 닫힐 때 히스토리 목록 갱신
    if (!open && selectedElement) {
      setCurrentElementHistory(regenerationService.getHistory(selectedElement.id));
    }
  };
  
  // 일관성 문제 수정 요청 핸들러
  const handleRequestFix = () => {
    if (!selectedElement || !regenerationResult) return;
    
    // 재생성 옵션 업데이트
    const enhancedOptions = {
      ...regenerationOptions,
      preserveContext: true,
      preserveKeywords: true,
      preserveFormat: true,
      styleIntensity: 0.8, // 스타일 강도 조정
    };
    
    setRegenerationOptions(enhancedOptions);
    
    // 향상된 옵션으로 재생성
    handleOptionsChange(enhancedOptions);
    handleExecuteRegeneration();
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b p-4">
        <h1 className="text-2xl font-bold">요소 재생성 테스트</h1>
        <p className="text-sm text-muted-foreground">
          캔버스의 텍스트나 이미지 요소를 선택하고 우클릭하여 컨텍스트 메뉴를 통해 재생성 기능을 사용해보세요.
        </p>
      </header>
      
      <main className="flex-1 flex">
        {/* 좌측: 캔버스 영역 */}
        <div className="flex-1 p-6 border-r relative">
          <canvas 
            ref={canvasRef} 
            className="border shadow-sm" 
            width={800} 
            height={600}
          />
          
          {/* 컨텍스트 메뉴 */}
          {contextMenuPosition && (
            <div
              className="fixed z-50"
              style={{
                top: contextMenuPosition.y,
                left: contextMenuPosition.x,
              }}
            >
              <div className="bg-popover border rounded-md shadow-md p-1 min-w-[160px]">
                <div className="px-2 py-1.5 text-sm font-semibold text-foreground mb-1">
                  {contextMenuElement && (
                    <div className="flex items-center">
                      {renderElementIcon(contextMenuElement.type)}
                      {contextMenuElement.type === 'text' ? '텍스트 요소' : '이미지 요소'}
                    </div>
                  )}
                </div>
                
                {contextMenuElement?.type === 'text' && (
                  <div
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={handleRegenerateText}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    텍스트 재생성
                  </div>
                )}
                
                {contextMenuElement?.type === 'image' && (
                  <>
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={handleRegenerateImage}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      이미지 재생성
                    </div>
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={handleTransformImage}
                    >
                      <Sliders className="mr-2 h-4 w-4" />
                      이미지 변형
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* 버튼 기반 메뉴 */}
          {selectedElement && canvasEngine && (
            <div className="absolute top-4 right-4">
              <ElementRegenerationMenu
                elementType={selectedElement.type}
                onRegenerateText={handleRegenerateText}
                onRegenerateImage={handleRegenerateImage}
              >
                <Button variant="outline" className="flex items-center">
                  <Wand2 className="mr-2 h-4 w-4" />
                  재생성 메뉴
                </Button>
              </ElementRegenerationMenu>
            </div>
          )}
        </div>
        
        {/* 우측: 컨트롤 패널 */}
        <div className="w-[350px] p-4 space-y-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>요소 선택</CardTitle>
            </CardHeader>
            <CardContent>
              {canvasEngine && (
                <ElementSelector 
                  canvasEngine={canvasEngine}
                  onElementSelected={handleElementSelected}
                />
              )}
            </CardContent>
          </Card>
          
          {selectedElement && (
            <div className="space-y-4">
              {/* 선택된 요소에 대한 액션 버튼 */}
              <div className="grid grid-cols-2 gap-2">
                {selectedElement.type === 'text' && (
                  <Button 
                    variant="outline"
                    onClick={handleRegenerateText}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    텍스트 재생성
                  </Button>
                )}
                
                {selectedElement.type === 'image' && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={handleRegenerateImage}
                      className="flex items-center justify-center"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      이미지 재생성
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={handleTransformImage}
                      className="flex items-center justify-center"
                    >
                      <Sliders className="mr-2 h-4 w-4" />
                      이미지 변형
                    </Button>
                  </>
                )}
              </div>
              
              {/* 재생성 옵션 */}
              {showOptions && (
                <RegenerationOptions 
                  elementType={selectedElement.type}
                  onRegenerate={handleExecuteRegeneration}
                  onOptionsChange={handleOptionsChange}
                  initialOptions={regenerationOptions}
                  onPreviewToggle={handlePreviewToggle}
                />
              )}
              
              {/* 이미지 변형 컨트롤 */}
              {showImageTransform && selectedElement.type === 'image' && (
                <ImageTransformControls
                  initialOptions={imageTransformOptions}
                  onOptionsChange={handleImageTransformOptionsChange}
                  onApplyTransform={handleApplyImageTransform}
                  onUndo={handleUndoImageTransform}
                />
              )}
              
              {/* 재생성 결과 */}
              {regenerationResult && (
                <RegenerationResult 
                  result={regenerationResult}
                  elementType={selectedElement.type}
                  onApply={handleApplyResult}
                  onCancel={handleCancelRegeneration}
                  onRegenerate={handleExecuteRegeneration}
                />
              )}
              
              {/* 결과 적용 버튼 */}
              <Button 
                variant="default"
                className="flex items-center justify-center"
                onClick={() => regenerationResult && handleApplyResult(regenerationResult)}
                disabled={!regenerationResult}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                적용하기
              </Button>
              
              {/* 취소 버튼 */}
              <Button 
                variant="outline"
                className="flex items-center justify-center"
                onClick={handleCancelRegeneration}
              >
                <Undo className="mr-2 h-4 w-4" />
                취소
              </Button>
            </div>
          )}
          
          {/* 히스토리 보기 버튼 */}
          {selectedElement && (
            <div className="mt-4">
              <p className="text-sm">
                <span className="font-medium">타입:</span> {selectedElement.type === 'text' ? '텍스트' : '이미지'}
              </p>
            </div>
          )}
          
          {/* 히스토리 보기 버튼 추가 */}
          {selectedElement && (
            <div className="mt-4">
              <HistoryDialog
                elementId={selectedElement.id}
                elementType={selectedElement.type}
                history={currentElementHistory}
                onRollback={handleRollback}
                onUndo={handleUndo}
                onOpenChange={handleHistoryDialogOpenChange}
                trigger={
                  <Button 
                    variant="outline"
                    className="flex items-center justify-center w-full"
                  >
                    <History className="mr-2 h-4 w-4" />
                    재생성 히스토리 관리
                  </Button>
                }
              />
            </div>
          )}
          
          {/* 검증 결과 표시 추가 */}
          {regenerationResult && showValidation && validationResult && (
            <div className="mt-4">
              <ConsistencyValidationUI 
                validationResult={validationResult} 
                onRequestFix={handleRequestFix}
                onClose={() => setShowValidation(false)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 