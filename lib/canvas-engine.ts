"use client";

import * as fabric from 'fabric';
import type { Canvas, Object as FabricObject, Image as FabricImage } from 'fabric';

// 캔버스 아이템 타입 정의
export type CanvasItemType = 'text' | 'image' | 'shape';

export interface CanvasItemOptions {
  id: string;
  type: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  scaleX?: number;
  scaleY?: number;
  angle?: number;
  flipX?: boolean;
  flipY?: boolean;
  opacity?: number;
  src?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  [key: string]: any;
}

// 이미지 아이템 타입 정의
export interface ImageItemOptions extends CanvasItemOptions {
  type: 'image';
  src?: string;
  objectCaching?: boolean;
  crossOrigin?: 'anonymous' | '' | null;
}

/**
 * 캔버스 렌더링 엔진 클래스
 * Fabric.js를 래핑하여 애플리케이션에 맞는 추상화 계층 제공
 */
export class CanvasEngine {
  private canvas: fabric.Canvas;
  private items: Map<string, fabric.Object> = new Map();
  private onSelectionChange?: (ids: string[]) => void;
  private modificationListeners: Set<() => void> = new Set();

  /**
   * 캔버스 엔진 초기화
   * @param canvasEl - 캔버스 DOM 요소 또는 ID
   * @param options - 캔버스 초기화 옵션
   */
  constructor(canvasEl: string | HTMLCanvasElement, options?: Partial<fabric.CanvasOptions>) {
    // 기본 옵션과 사용자 정의 옵션 병합
    const defaultOptions: Partial<fabric.CanvasOptions> = {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      width: 800,
      height: 600,
      renderOnAddRemove: true,
    };

    this.canvas = new fabric.Canvas(canvasEl, { ...defaultOptions, ...options });
    this.setupEventListeners();
  }

  /**
   * 캔버스 이벤트 리스너 설정
   */
  private setupEventListeners() {
    // 선택 변경 이벤트
    this.canvas.on('selection:created', this.handleSelectionChange.bind(this));
    this.canvas.on('selection:updated', this.handleSelectionChange.bind(this));
    this.canvas.on('selection:cleared', this.handleSelectionChange.bind(this));

    // 객체 변경 이벤트
    this.canvas.on('object:modified', this.handleObjectModified.bind(this));
  }

  /**
   * 선택 변경 핸들러
   */
  private handleSelectionChange() {
    if (!this.onSelectionChange) return;

    const activeObjects = this.canvas.getActiveObjects();
    const selectedIds = activeObjects.map((obj: fabric.Object) => {
      const data = obj.get('data') as { id: string } | undefined;
      return data?.id;
    }).filter((id): id is string => id !== undefined);
    
    this.onSelectionChange(selectedIds);
  }

  /**
   * 객체 수정 핸들러
   */
  private handleObjectModified() {
    this.notifyModification();
  }

  /**
   * 캔버스 수정 알림
   */
  private notifyModification() {
    this.modificationListeners.forEach(listener => listener());
  }

  /**
   * 캔버스 수정 리스너 등록
   * @param listener - 수정 시 호출될 콜백 함수
   * @returns 리스너 제거 함수
   */
  public onModified(listener: () => void): () => void {
    this.modificationListeners.add(listener);
    return () => {
      this.modificationListeners.delete(listener);
    };
  }

  /**
   * 선택 변경 리스너 설정
   * @param callback - 선택 변경 시 호출될 콜백 함수
   */
  public setSelectionChangeListener(callback: (ids: string[]) => void) {
    this.onSelectionChange = callback;
  }

  /**
   * 텍스트 아이템 추가
   * @param options - 텍스트 아이템 옵션
   * @returns 생성된 텍스트 아이템의 ID
   */
  public addText(options: CanvasItemOptions): string {
    const { id, left = 50, top = 50, text = '텍스트를 입력하세요', ...rest } = options;

    const textObj = new fabric.Textbox(text, {
      left,
      top,
      width: 200,
      fontFamily: 'Arial',
      fontSize: 20,
      fill: '#000000',
      data: { id, type: 'text' },
      ...rest
    });

    this.canvas.add(textObj);
    this.items.set(id, textObj);
    this.canvas.setActiveObject(textObj);
    this.notifyModification();
    return id;
  }

  /**
   * 이미지를 캔버스에 추가합니다.
   * @param options 이미지 옵션
   * @param fabricImage (선택 사항) 기존 Fabric.js 이미지 객체
   */
  async addImage(options: CanvasItemOptions, fabricImage?: fabric.Image): Promise<fabric.Image | null> {
    if (!this.canvas) return null;
    
    // Fabric.js 이미지 객체 생성 또는 기존 객체 사용
    let img: fabric.Image;
    
    if (fabricImage) {
      // 기존 Fabric.js 이미지 객체 사용
      img = fabricImage;
      img.set(options);
      img.set('data', { id: options.id });
    } else if (options.src) {
      // 새 이미지 객체 생성
      return new Promise((resolve) => {
        // @ts-expect-error - fabric.js 타입 정의 문제 회피
        fabric.Image.fromURL(options.src, (image) => {
          image.set(options);
          image.set('data', { id: options.id });
          
          this.canvas?.add(image);
          this.canvas?.renderAll();
          
          resolve(image);
        }, { crossOrigin: 'anonymous' });
      });
    } else {
      console.error('이미지 추가 실패: 이미지 소스가 없습니다.');
      return null;
    }
    
    // 캔버스에 이미지 추가
    this.canvas.add(img);
    this.canvas.renderAll();
    
    return img;
  }

  /**
   * 도형 아이템 추가
   * @param options - 도형 아이템 옵션
   * @returns 생성된 도형 아이템의 ID
   */
  public addShape(options: CanvasItemOptions & { shape: 'rect' | 'circle' | 'triangle' }): string {
    const { id, left = 50, top = 50, width = 100, height = 100, shape = 'rect', fill = '#cccccc', ...rest } = options;
    
    let shapeObj: fabric.Object;
    
    switch (shape) {
      case 'rect':
        shapeObj = new fabric.Rect({
          left,
          top,
          width,
          height,
          fill,
          ...rest
        });
        break;
      case 'circle':
        shapeObj = new fabric.Circle({
          left,
          top,
          radius: Math.min(width, height) / 2,
          fill,
          ...rest
        });
        break;
      case 'triangle':
        shapeObj = new fabric.Triangle({
          left,
          top,
          width,
          height,
          fill,
          ...rest
        });
        break;
      default:
        throw new Error(`지원하지 않는 도형 타입: ${shape}`);
    }
    
    shapeObj.set({ data: { id, type: 'shape', shapeType: shape } });
    this.canvas.add(shapeObj);
    this.items.set(id, shapeObj);
    this.canvas.setActiveObject(shapeObj);
    this.notifyModification();
    return id;
  }

  /**
   * 아이템 제거
   * @param id - 제거할 아이템 ID
   */
  public removeItem(id: string): void {
    const item = this.items.get(id);
    if (item) {
      this.canvas.remove(item);
      this.items.delete(id);
      this.notifyModification();
    }
  }

  /**
   * 선택된 아이템 제거
   */
  public removeSelectedItems(): void {
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length === 0) return;

    this.canvas.discardActiveObject();
    
    activeObjects.forEach((obj: fabric.Object) => {
      const data = obj.get('data') as { id: string } | undefined;
      const id = data?.id;
      if (id) {
        this.items.delete(id);
      }
      this.canvas.remove(obj);
    });
    
    this.canvas.requestRenderAll();
    this.notifyModification();
  }

  /**
   * 아이템 속성 업데이트
   * @param id - 업데이트할 아이템 ID
   * @param props - 업데이트할 속성
   */
  public updateItem(id: string, props: Partial<CanvasItemOptions>): void {
    const item = this.items.get(id);
    if (!item) return;

    item.set(props);
    this.canvas.requestRenderAll();
    this.notifyModification();
  }

  /**
   * 모든 아이템 선택 해제
   */
  public deselectAll(): void {
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
  }

  /**
   * 캔버스 크기 조정
   * @param width - 너비
   * @param height - 높이
   */
  public resizeCanvas(width: number, height: number): void {
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.canvas.requestRenderAll();
  }

  /**
   * 캔버스를 이미지로 내보내기
   * @param format - 이미지 포맷 (png, jpeg 등)
   * @param quality - 이미지 품질 (0-1)
   * @returns 이미지 데이터 URL
   */
  public exportToImage(format: 'png' | 'jpeg' = 'png', quality: number = 1): string {
    return this.canvas.toDataURL({
      format,
      quality,
      multiplier: 2 // 고해상도 출력을 위한 배율
    });
  }

  /**
   * 모든 아이템 정리
   */
  public clear(): void {
    this.canvas.clear();
    this.items.clear();
    this.notifyModification();
  }

  /**
   * 캔버스 객체 직접 접근 (고급 사용자용)
   * @returns Fabric.js 캔버스 객체
   */
  public getFabricCanvas(): fabric.Canvas {
    return this.canvas;
  }

  /**
   * 이미지 URL 또는 데이터 URL로부터 Fabric.js 이미지 객체를 로드합니다.
   */
  async loadImage(src: string): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      // @ts-expect-error - fabric.js 타입 정의 문제 회피
      fabric.Image.fromURL(src, (img) => {
        resolve(img);
      }, { crossOrigin: 'anonymous' });
    });
  }
  
  /**
   * 기존 이미지 객체를 새로운 이미지로 교체합니다.
   */
  replaceImage(id: string, newImage: fabric.Image): boolean {
    if (!this.canvas) return false;
    
    // 기존 이미지 객체 찾기
    const objects = this.canvas.getObjects();
    for (const obj of objects) {
      const data = obj.get('data') as { id: string } | undefined;
      
      if (data?.id === id && obj.type === 'image') {
        // 객체 속성 복사
        const { left, top, scaleX, scaleY, angle, flipX, flipY } = obj;
        
        // 새 이미지 설정
        newImage.set({
          left,
          top,
          scaleX,
          scaleY,
          angle,
          flipX,
          flipY,
          data: { id },
        });
        
        // 기존 객체 제거
        this.canvas.remove(obj);
        
        // 새 이미지 추가
        this.canvas.add(newImage);
        this.canvas.renderAll();
        
        return true;
      }
    }
    
    return false;
  }
} 