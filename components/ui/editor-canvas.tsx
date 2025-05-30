"use client";

import { useState } from 'react';
import { DragDropProvider } from './drag-drop-provider';
import { DraggableItem } from './draggable-item';
import { DropZone } from './drop-zone';
import { ResizableItem } from './resizable-item';
import { MultiSelectContainer } from './multi-select-container';

// 드래그 아이템 타입 정의
const ITEM_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
};

interface CanvasItem {
  id: string;
  type: string;
  content: string;
  position: { x: number; y: number };
  width?: number;
  height?: number;
  angle?: number;
}

export function EditorCanvas() {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // 드롭 이벤트 핸들러
  const handleDrop = (item: any, position: { x: number; y: number }) => {
    // 새 아이템 추가
    if (item.type === ITEM_TYPES.TEXT || item.type === ITEM_TYPES.IMAGE) {
      const newItem: CanvasItem = {
        id: `item-${Date.now()}`,
        type: item.type,
        content: item.data?.content || (item.type === ITEM_TYPES.TEXT ? '텍스트를 입력하세요' : '/placeholder.jpg'),
        position,
      };
      
      setItems([...items, newItem]);
    }
  };
  
  // 아이템 위치 업데이트 핸들러
  const updateItemPosition = (id: string, position: { x: number; y: number }) => {
    setItems(
      items.map(item => 
        item.id === id
          ? { ...item, position }
          : item
      )
    );
  };
  
  // 아이템 크기 업데이트 핸들러
  const updateItemSize = (id: string, width: number, height: number) => {
    setItems(
      items.map(item => 
        item.id === id
          ? { ...item, width, height }
          : item
      )
    );
  };
  
  // 아이템 회전 업데이트 핸들러
  const updateItemRotation = (id: string, angle: number) => {
    setItems(
      items.map(item => 
        item.id === id
          ? { ...item, angle }
          : item
      )
    );
  };
  
  // 아이템 삭제 핸들러
  const deleteSelectedItems = () => {
    setItems(items.filter(item => !selectedItemIds.includes(item.id)));
    setSelectedItemIds([]);
  };
  
  // 선택 변경 이벤트 핸들러
  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedItemIds(selectedIds);
  };
  
  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Delete 키로 선택된 아이템 삭제
    if (e.key === 'Delete' && selectedItemIds.length > 0) {
      deleteSelectedItems();
    }
  };
  
  return (
    <DragDropProvider>
      <div 
        className="relative border rounded-md bg-background"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="p-2 border-b bg-muted/50">
          <div className="flex space-x-2">
            <DraggableItem 
              id="text-item"
              type={ITEM_TYPES.TEXT}
              data={{ content: '새 텍스트' }}
              className="px-3 py-1 bg-secondary rounded-md cursor-grab"
            >
              텍스트 추가
            </DraggableItem>
            
            <DraggableItem 
              id="image-item"
              type={ITEM_TYPES.IMAGE}
              data={{ content: '/placeholder.jpg' }}
              className="px-3 py-1 bg-secondary rounded-md cursor-grab"
            >
              이미지 추가
            </DraggableItem>
          </div>
        </div>
        
        <MultiSelectContainer
          className="min-h-[500px] w-full relative p-4"
          onSelectionChange={handleSelectionChange}
        >
          <DropZone
            accept={[ITEM_TYPES.TEXT, ITEM_TYPES.IMAGE]}
            onDrop={handleDrop}
            className="w-full h-full absolute inset-0"
          >
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.position.x}px`,
                  top: `${item.position.y}px`,
                }}
              >
                <ResizableItem
                  initialWidth={item.width || 200}
                  initialHeight={item.height || 100}
                  onResize={(width, height) => updateItemSize(item.id, width, height)}
                  onRotate={(angle) => updateItemRotation(item.id, angle)}
                  className={`${
                    selectedItemIds.includes(item.id) 
                      ? 'border-2 border-primary' 
                      : 'border border-border'
                  } bg-card`}
                >
                  {item.type === ITEM_TYPES.TEXT ? (
                    <div className="w-full h-full p-4 overflow-hidden">
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        className="w-full h-full focus:outline-none"
                      >
                        {item.content}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                      <div className="text-center text-muted-foreground">
                        이미지 플레이스홀더
                      </div>
                    </div>
                  )}
                </ResizableItem>
              </div>
            ))}
          </DropZone>
        </MultiSelectContainer>
        
        {selectedItemIds.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-card p-2 rounded-md shadow-md">
            <button
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-sm"
              onClick={deleteSelectedItems}
            >
              선택 삭제
            </button>
          </div>
        )}
      </div>
    </DragDropProvider>
  );
} 