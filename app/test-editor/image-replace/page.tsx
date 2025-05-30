"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { FabricCanvas } from '@/components/ui/fabric-canvas';
import { ImageSelector } from '@/components/ui/image-selector';
import { ImageEditor } from '@/components/ui/image-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Canvas } from 'fabric';
import { CanvasEngine } from '@/lib/canvas-engine';
import { Loader2, ImageIcon, RefreshCw, Pencil, Replace, History, Undo, Redo } from 'lucide-react';
import { getInlineSampleImageURLs, useSampleImages } from '@/lib/create-sample-images';
import { HistoryManager, ImageEditData } from '@/lib/history-manager';

// fabric.js 모듈 임포트 도우미 함수
const importFabric = async () => {
  const fabricModule = await import('fabric');
  return fabricModule;
};

export default function ImageReplacePage() {
  // 샘플 이미지 훅 사용
  useSampleImages();
  
  // 샘플 이미지 상태
  const [sampleImages, setSampleImages] = useState<string[]>([]);

  // Fabric.js 캔버스 참조
  const canvasRef = useRef<Canvas | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  
  // 컴포넌트 마운트 시 샘플 이미지 초기화
  useEffect(() => {
    // 클라이언트 사이드에서만 샘플 이미지 가져오기
    setSampleImages(getInlineSampleImageURLs());
  }, []);
  
  // 히스토리 관리자 참조
  const historyRef = useRef<HistoryManager<ImageEditData>>(new HistoryManager(30));
  
  // 상태 관리
  const [isCanvasReady, setIsCanvasReady] = useState<boolean>(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentImageSrc, setCurrentImageSrc] = useState<string | null>(null);
  
  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // 이미지 교체 다이얼로그 상태
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState<boolean>(false);
  
  // 히스토리 상태
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // 히스토리 목록 상태
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  // 캔버스 초기화
  useEffect(() => {
    if (isCanvasReady && canvasRef.current) {
      // 기본 도형 및 이미지 추가
      addInitialObjects();
    }
  }, [isCanvasReady]);

  // 캔버스 준비 상태 설정
  const handleCanvasReady = (canvas: Canvas, engine: CanvasEngine) => {
    canvasRef.current = canvas;
    engineRef.current = engine;
    setIsCanvasReady(true);
  };

  // 초기 객체 추가
  const addInitialObjects = async () => {
    if (!canvasRef.current || !engineRef.current || sampleImages.length === 0) return;
    
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    
    // fabric 모듈 가져오기
    const fabric = await importFabric();
    
    // 배경 사각형 추가
    engine.addShape({
      id: 'rect-1',
      type: 'shape',
      shape: 'rect',
      left: 50,
      top: 50,
      width: 200,
      height: 200,
      fill: '#f0f0f0',
      stroke: '#cccccc',
      strokeWidth: 2,
      rx: 10,
      ry: 10,
    });
    
    // 기본 이미지 추가
    engine.addImage({
      id: 'image-1',
      type: 'image',
      left: 300,
      top: 100,
      scaleX: 0.5,
      scaleY: 0.5,
      src: sampleImages[0] || '', // 인라인 샘플 이미지 사용
      objectCaching: false,
    });
    
    // 텍스트 추가
    engine.addText({
      id: 'text-1',
      type: 'text',
      left: 100,
      top: 300,
      text: '이미지 교체 테스트',
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#333333',
    });
  };

  // 객체 선택 이벤트 처리
  const handleObjectSelected = (e: any) => {
    const target = e.selected?.[0];
    
    if (target && target.type === 'image') {
      // 이미지 객체가 선택된 경우
      const data = target.get('data') as { id: string } | undefined;
      if (data?.id) {
        setSelectedImageId(data.id);
        
        // 현재 이미지 소스 URL 가져오기
        if (target.getSrc) {
          setCurrentImageSrc(target.getSrc());
        } else if (target._element) {
          setCurrentImageSrc(target._element.src);
        }
      }
    } else {
      // 이미지가 아닌 객체가 선택된 경우
      setSelectedImageId(null);
      setCurrentImageSrc(null);
    }
  };

  // 객체 선택 해제 이벤트 처리
  const handleSelectionCleared = () => {
    setSelectedImageId(null);
    setCurrentImageSrc(null);
  };

  // 히스토리 관리자 초기화
  useEffect(() => {
    if (isCanvasReady && historyRef.current) {
      const history = historyRef.current;
      
      // 히스토리 변경 리스너 설정
      const unsubscribe = history.onHistoryChange(() => {
        setCanUndo(history.canUndo());
        setCanRedo(history.canRedo());
      });
      
      return unsubscribe;
    }
  }, [isCanvasReady]);
  
  // 히스토리에 작업 기록
  const addToHistory = useCallback((type: string, targetId: string, description: string, data: ImageEditData) => {
    const history = historyRef.current;
    if (!history) return;
    
    history.addItem({
      type,
      targetId,
      description,
      data
    });
  }, []);

  // 이미지 교체 처리
  const handleImageReplace = useCallback((imageUrl: string, file?: File) => {
    setIsLoading(true);
    
    if (selectedImageId && canvasRef.current && engineRef.current) {
      const engine = engineRef.current;
      
      // 이전 이미지 상태 저장
      const previousImageSrc = currentImageSrc;
      
      // 기존 이미지 객체 찾기
      engine.loadImage(imageUrl).then(img => {
        // 이미지 교체
        engine.replaceImage(selectedImageId, img);
        
        // 현재 이미지 URL 업데이트
        setCurrentImageSrc(imageUrl);
        
        // 히스토리에 기록
        addToHistory(
          'image-replace', 
          selectedImageId, 
          '이미지 교체', 
          {
            previousState: previousImageSrc || undefined,
            currentState: imageUrl
          }
        );
        
        setIsLoading(false);
      }).catch(error => {
        console.error('이미지 교체 오류:', error);
        setIsLoading(false);
      });
    } else if (engineRef.current) {
      // 새 이미지 추가 (이미지가 선택되지 않은 경우)
      const engine = engineRef.current;
      engine.loadImage(imageUrl).then(img => {
        // 이미지 객체 ID 생성
        const imageId = `image-${Date.now()}`;
        
        // 이미지 추가
        engine.addImage({
          id: imageId,
          type: 'image',
          left: 200,
          top: 200,
          scaleX: 0.5,
          scaleY: 0.5,
          objectCaching: false,
        }, img);
        
        // 히스토리에 기록
        addToHistory(
          'image-add', 
          imageId, 
          '이미지 추가', 
          {
            currentState: imageUrl
          }
        );
        
        setIsLoading(false);
      }).catch(error => {
        console.error('이미지 추가 오류:', error);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [selectedImageId, engineRef, currentImageSrc, addToHistory]);

  // 새 이미지 추가
  const addNewImage = useCallback(async (imageDataUrl: string) => {
    if (!canvasRef.current || !engineRef.current) return;
    
    const engine = engineRef.current;
    setIsLoading(true);
    
    try {
      // 새 이미지 객체 ID 생성
      const imageId = `image-${Date.now()}`;
      
      // 이미지 로드 및 추가
      await engine.loadImage(imageDataUrl).then(img => {
        // 이미지 추가
        engine.addImage({
          id: imageId,
          type: 'image',
          left: 200,
          top: 200,
          scaleX: 0.5,
          scaleY: 0.5,
          objectCaching: false,
        }, img);
        
        // 히스토리에 기록
        addToHistory(
          'image-add', 
          imageId, 
          '새 이미지 추가', 
          {
            currentState: imageDataUrl
          }
        );
      });
    } catch (error) {
      console.error('이미지 추가 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, [canvasRef, engineRef, addToHistory]);

  // 이미지 편집 모드 시작
  const handleStartEditing = useCallback(() => {
    if (currentImageSrc) {
      setIsEditMode(true);
    }
  }, [currentImageSrc]);
  
  // 이미지 편집 취소
  const handleCancelEditing = useCallback(() => {
    setIsEditMode(false);
  }, []);
  
  // 편집된 이미지 적용
  const handleApplyEditedImage = useCallback((editedImageUrl: string) => {
    setIsLoading(true);
    
    if (selectedImageId && canvasRef.current && engineRef.current) {
      const engine = engineRef.current;
      
      // 이전 이미지 상태 저장
      const previousImageSrc = currentImageSrc;
      
      // 기존 이미지 객체 찾기
      engine.loadImage(editedImageUrl).then(img => {
        const objects = canvasRef.current?.getObjects() || [];
        for (const obj of objects) {
          const data = obj.get('data') as { id: string } | undefined;
          
          if (data?.id === selectedImageId && obj.type === 'image') {
            // 이미지 교체
            engine.replaceImage(selectedImageId, img);
            break;
          }
        }
        
        // 현재 이미지 URL 업데이트
        setCurrentImageSrc(editedImageUrl);
        
        // 히스토리에 기록
        addToHistory(
          'image-edit', 
          selectedImageId, 
          '이미지 편집', 
          {
            previousState: previousImageSrc || undefined,
            currentState: editedImageUrl,
            editType: 'edit'
          }
        );
        
        // 편집 모드 종료
        setIsEditMode(false);
        setIsLoading(false);
      }).catch(error => {
        console.error('편집된 이미지 적용 오류:', error);
        setIsLoading(false);
      });
    }
  }, [selectedImageId, canvasRef, engineRef, currentImageSrc, addToHistory]);

  // 이미지 교체 핸들러
  const handleReplaceImage = useCallback((imageId: string) => {
    setIsReplaceDialogOpen(true);
  }, []);

  // 실행 취소
  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (!history || !canUndo) return;
    
    const undoneItem = history.undo();
    if (undoneItem && undoneItem.type === 'image-replace' && undoneItem.data.previousState) {
      // 이전 이미지로 복원
      if (selectedImageId && engineRef.current) {
        setIsLoading(true);
        
        engineRef.current.loadImage(undoneItem.data.previousState).then(img => {
          engineRef.current?.replaceImage(selectedImageId, img);
          setCurrentImageSrc(undoneItem.data.previousState || null);
          setIsLoading(false);
        }).catch(error => {
          console.error('이미지 복원 오류:', error);
          setIsLoading(false);
        });
      }
    }
  }, [canUndo, selectedImageId]);

  // 다시 실행
  const handleRedo = useCallback(() => {
    const history = historyRef.current;
    if (!history || !canRedo) return;
    
    const redoneItem = history.redo();
    if (redoneItem && redoneItem.type === 'image-replace' && redoneItem.data.currentState) {
      // 다시 이미지 적용
      if (selectedImageId && engineRef.current) {
        setIsLoading(true);
        
        engineRef.current.loadImage(redoneItem.data.currentState).then(img => {
          engineRef.current?.replaceImage(selectedImageId, img);
          setCurrentImageSrc(redoneItem.data.currentState || null);
          setIsLoading(false);
        }).catch(error => {
          console.error('이미지 복원 오류:', error);
          setIsLoading(false);
        });
      }
    }
  }, [canRedo, selectedImageId]);

  // 히스토리 목록 업데이트
  useEffect(() => {
    if (historyRef.current) {
      const updateHistoryItems = () => {
        const history = historyRef.current.getHistory();
        const currentIndex = historyRef.current.getCurrentIndex();
        setHistoryItems(history.map((item, index) => ({
          ...item,
          isCurrent: index === currentIndex
        })));
      };
      
      // 초기 히스토리 아이템 설정
      updateHistoryItems();
      
      // 히스토리 변경 시 아이템 업데이트
      const unsubscribe = historyRef.current.onHistoryChange(updateHistoryItems);
      
      return unsubscribe;
    }
  }, []);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">이미지 교체 테스트</h1>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* 캔버스 영역 */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>캔버스</CardTitle>
              <CardDescription>
                이미지를 선택하고 오른쪽 패널에서 이미지를 교체할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FabricCanvas
                width={600}
                height={400}
                onReady={handleCanvasReady}
                onObjectSelected={handleObjectSelected}
                onSelectionCleared={handleSelectionCleared}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* 이미지 교체 패널 */}
        <div className="w-full lg:w-96">
          <Card>
            <CardHeader>
              <CardTitle>이미지 교체</CardTitle>
              <CardDescription>
                {selectedImageId 
                  ? '선택한 이미지를 교체하거나 수정할 수 있습니다.'
                  : '캔버스에서 이미지를 선택하거나 새 이미지를 추가하세요.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedImageId && currentImageSrc ? (
                <div className="flex flex-col gap-2 p-4 border rounded-md">
                  <h3 className="text-lg font-medium">선택된 이미지</h3>
                  <div className="relative w-full h-32 overflow-hidden rounded-md">
                    <img 
                      src={currentImageSrc} 
                      alt="Selected" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleStartEditing}
                      className="flex-1"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      편집
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReplaceImage(selectedImageId)}
                      className="flex-1"
                    >
                      <Replace className="w-4 h-4 mr-1" />
                      교체
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 border rounded-md border-dashed text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>캔버스에서 이미지를 선택하세요</p>
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={addInitialObjects}
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  초기 상태로 리셋
                </Button>
              </div>
              
              {/* 히스토리 제어 버튼 */}
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!canUndo}
                  className="flex-1"
                >
                  <Undo className="w-4 h-4 mr-1" />
                  실행 취소
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!canRedo}
                  className="flex-1"
                >
                  <Redo className="w-4 h-4 mr-1" />
                  다시 실행
                </Button>
              </div>
              
              {/* 히스토리 목록 버튼 */}
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className="w-full text-xs"
                >
                  <History className="w-4 h-4 mr-1" />
                  {isHistoryOpen ? '히스토리 숨기기' : '히스토리 표시'}
                </Button>
              </div>
              
              {/* 히스토리 목록 */}
              {isHistoryOpen && (
                <div className="mt-2 border rounded-md p-2 max-h-40 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">편집 기록</h4>
                  {historyItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground">아직 편집 기록이 없습니다.</p>
                  ) : (
                    <ul className="space-y-1">
                      {historyItems.map((item, index) => (
                        <li 
                          key={item.id}
                          className={`text-xs p-1 rounded ${item.isCurrent ? 'bg-primary/10 font-medium' : ''}`}
                        >
                          {index + 1}. {item.description} ({new Date(item.timestamp).toLocaleTimeString()})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 이미지 편집 모달 */}
      {isEditMode && currentImageSrc && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold mb-4">이미지 편집</h2>
            <ImageEditor 
              src={currentImageSrc}
              onComplete={handleApplyEditedImage}
              onCancel={handleCancelEditing}
              width={600}
              height={400}
            />
          </div>
        </div>
      )}
      
      {/* 이미지 교체 모달 */}
      {isReplaceDialogOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">이미지 교체</h2>
            <ImageSelector
              currentImage={currentImageSrc || undefined}
              onImageSelected={(imageUrl) => {
                handleImageReplace(imageUrl);
                setIsReplaceDialogOpen(false);
              }}
              onCancel={() => setIsReplaceDialogOpen(false)}
              isLoading={isLoading}
              buttonText="이미지 선택"
              sampleImages={sampleImages}
              width={500}
              height={300}
            />
          </div>
        </div>
      )}
    </div>
  );
} 