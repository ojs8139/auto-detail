"use client";

import type { Canvas, Object as FabricObject, Image as FabricImage } from 'fabric';
import { saveAs } from 'file-saver';

/**
 * 다양한 캔버스 요소를 하나의 이미지로 병합하는 유틸리티 클래스
 */
export class CanvasMerger {
  /**
   * 여러 캔버스 객체를 하나의 이미지로 병합
   * @param canvases - 병합할 캔버스 객체 배열
   * @param options - 병합 옵션
   * @returns 병합된 캔버스 객체 (HTMLCanvasElement)
   */
  public static async mergeCanvases(
    canvases: HTMLCanvasElement[], 
    options: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      spacing?: number;
      direction?: 'vertical' | 'horizontal';
    } = {}
  ): Promise<HTMLCanvasElement> {
    // 기본 옵션 설정
    const {
      backgroundColor = '#ffffff',
      spacing = 0,
      direction = 'vertical'
    } = options;

    // 캔버스가 없는 경우 빈 캔버스 반환
    if (!canvases.length) {
      const emptyCanvas = document.createElement('canvas');
      emptyCanvas.width = options.width || 800;
      emptyCanvas.height = options.height || 600;
      const ctx = emptyCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, emptyCanvas.width, emptyCanvas.height);
      }
      return emptyCanvas;
    }

    // 병합된 캔버스의 크기 계산
    let totalWidth = 0;
    let totalHeight = 0;

    if (direction === 'vertical') {
      // 세로 방향 병합 시 너비는 가장 넓은 캔버스 기준, 높이는 모든 캔버스 높이 합
      totalWidth = Math.max(...canvases.map(canvas => canvas.width));
      totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0) + (spacing * (canvases.length - 1));
    } else {
      // 가로 방향 병합 시 높이는 가장 높은 캔버스 기준, 너비는 모든 캔버스 너비 합
      totalWidth = canvases.reduce((sum, canvas) => sum + canvas.width, 0) + (spacing * (canvases.length - 1));
      totalHeight = Math.max(...canvases.map(canvas => canvas.height));
    }

    // 사용자 지정 크기가 있으면 적용
    const finalWidth = options.width || totalWidth;
    const finalHeight = options.height || totalHeight;

    // 병합 캔버스 생성
    const mergedCanvas = document.createElement('canvas');
    mergedCanvas.width = finalWidth;
    mergedCanvas.height = finalHeight;
    const ctx = mergedCanvas.getContext('2d');

    if (!ctx) {
      throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
    }

    // 배경색 채우기
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    // 각 캔버스를 병합 캔버스에 그리기
    let currentX = 0;
    let currentY = 0;

    for (const canvas of canvases) {
      // 캔버스 위치 계산 (가운데 정렬)
      let drawX = currentX;
      let drawY = currentY;

      if (direction === 'vertical') {
        // 세로 방향일 때 가로 가운데 정렬
        drawX = (finalWidth - canvas.width) / 2;
      } else {
        // 가로 방향일 때 세로 가운데 정렬
        drawY = (finalHeight - canvas.height) / 2;
      }

      // 캔버스 그리기
      ctx.drawImage(canvas, drawX, drawY);

      // 다음 위치 계산
      if (direction === 'vertical') {
        currentY += canvas.height + spacing;
      } else {
        currentX += canvas.width + spacing;
      }
    }

    return mergedCanvas;
  }

  /**
   * Fabric.js 캔버스 객체를 병합
   * @param fabricCanvases - 병합할 Fabric.js 캔버스 객체 배열
   * @param options - 병합 옵션
   * @returns 병합된 캔버스 객체 (HTMLCanvasElement)
   */
  public static async mergeFabricCanvases(
    fabricCanvases: Canvas[],
    options: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      spacing?: number;
      direction?: 'vertical' | 'horizontal';
    } = {}
  ): Promise<HTMLCanvasElement> {
    // Fabric.js 캔버스에서 HTMLCanvasElement 추출
    const htmlCanvases = fabricCanvases.map(fabricCanvas => {
      // Fabric 캔버스의 하단 HTMLCanvasElement 가져오기
      return fabricCanvas.getElement() as HTMLCanvasElement;
    });

    // HTMLCanvasElement 병합 함수 호출
    return this.mergeCanvases(htmlCanvases, options);
  }

  /**
   * 여러 이미지 URL을 병합하여 하나의 캔버스로 만들기
   * @param imageUrls - 병합할 이미지 URL 배열
   * @param options - 병합 옵션
   * @returns 병합된 캔버스 객체 (HTMLCanvasElement)
   */
  public static async mergeImages(
    imageUrls: string[],
    options: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      spacing?: number;
      direction?: 'vertical' | 'horizontal';
    } = {}
  ): Promise<HTMLCanvasElement> {
    // 이미지를 로드하여 캔버스로 변환
    const canvases = await Promise.all(
      imageUrls.map(async (url) => {
        return new Promise<HTMLCanvasElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas);
            } else {
              reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다.'));
            }
          };
          
          img.onerror = () => {
            reject(new Error(`이미지를 로드할 수 없습니다: ${url}`));
          };
          
          img.src = url;
        });
      })
    );

    // 변환된 캔버스 병합
    return this.mergeCanvases(canvases, options);
  }

  /**
   * 여러 캔버스 요소를 병합하고 결과를 데이터 URL로 반환
   * @param canvases - 병합할 캔버스 객체 배열
   * @param options - 병합 및 내보내기 옵션
   * @returns 데이터 URL 문자열
   */
  public static async mergeAndExport(
    canvases: HTMLCanvasElement[] | Canvas[],
    options: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      spacing?: number;
      direction?: 'vertical' | 'horizontal';
      format?: 'png' | 'jpeg' | 'svg' | 'pdf';
      quality?: number;
    } = {}
  ): Promise<string> {
    const { format = 'png', quality = 1 } = options;
    
    let mergedCanvas: HTMLCanvasElement;
    
    // Fabric.js 캔버스 또는 일반 캔버스 처리
    if (canvases.length > 0 && 'getElement' in canvases[0]) {
      // Fabric.js 캔버스 배열인 경우
      mergedCanvas = await this.mergeFabricCanvases(canvases as Canvas[], options);
    } else {
      // HTMLCanvasElement 배열인 경우
      mergedCanvas = await this.mergeCanvases(canvases as HTMLCanvasElement[], options);
    }
    
    // 데이터 URL로 내보내기
    if (format === 'png' || format === 'jpeg') {
      return mergedCanvas.toDataURL(`image/${format}`, quality);
    } else if (format === 'svg') {
      return await this.canvasToSVG(mergedCanvas);
    } else if (format === 'pdf') {
      return await this.canvasToPDF(mergedCanvas);
    }
    
    // 기본적으로 PNG로 내보내기
    return mergedCanvas.toDataURL('image/png', quality);
  }

  /**
   * 캔버스를 SVG 형식으로 변환
   * @param canvas - 변환할 캔버스
   * @returns SVG 데이터 URL
   */
  public static async canvasToSVG(canvas: HTMLCanvasElement): Promise<string> {
    // 캔버스 이미지 데이터 가져오기
    const imageData = canvas.toDataURL('image/png');
    
    // SVG 생성
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
        <image width="${canvas.width}" height="${canvas.height}" href="${imageData}" />
      </svg>
    `;
    
    // SVG를 Blob으로 변환
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    
    // Blob을 데이터 URL로 변환
    return URL.createObjectURL(blob);
  }

  /**
   * 캔버스를 PDF 형식으로 변환
   * @param canvas - 변환할 캔버스
   * @returns PDF 데이터 URL
   */
  public static async canvasToPDF(canvas: HTMLCanvasElement): Promise<string> {
    try {
      // PDF 생성을 위한 jsPDF 동적 로드
      const { jsPDF } = await import('jspdf');
      
      // 이미지 크기에 맞는 PDF 생성
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      // 캔버스 이미지를 PDF에 추가
      const imageData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      // PDF를 데이터 URL로 변환
      return pdf.output('datauristring');
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      throw new Error('PDF 내보내기를 위해 jspdf 패키지가 필요합니다.');
    }
  }

  /**
   * 섹션별로 캔버스 내용을 추출
   * @param canvas - 섹션을 추출할 캔버스
   * @param section - 추출할 섹션 정보 (x, y, width, height)
   * @returns 섹션이 추출된 새 캔버스
   */
  public static extractSection(
    canvas: HTMLCanvasElement,
    section: { x: number; y: number; width: number; height: number }
  ): HTMLCanvasElement {
    const { x, y, width, height } = section;
    
    // 섹션 범위 검증
    const validX = Math.max(0, Math.min(x, canvas.width));
    const validY = Math.max(0, Math.min(y, canvas.height));
    const validWidth = Math.min(width, canvas.width - validX);
    const validHeight = Math.min(height, canvas.height - validY);
    
    // 새 캔버스 생성
    const sectionCanvas = document.createElement('canvas');
    sectionCanvas.width = validWidth;
    sectionCanvas.height = validHeight;
    
    const ctx = sectionCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 원본 캔버스에서 섹션 추출하여 새 캔버스에 그리기
    ctx.drawImage(
      canvas,
      validX, validY, validWidth, validHeight,  // 소스 영역
      0, 0, validWidth, validHeight             // 대상 영역
    );
    
    return sectionCanvas;
  }
}

/**
 * 캔버스 병합 작업을 위한 유틸리티 함수 모음
 */
export const CanvasMergerUtils = {
  /**
   * 데이터 URL을 Blob으로 변환
   * @param dataUrl - 변환할 데이터 URL
   * @returns Blob 객체
   */
  dataUrlToBlob(dataUrl: string): Blob {
    const arr = dataUrl.split(',');
    if (arr.length < 2) {
      throw new Error('유효하지 않은 데이터 URL입니다.');
    }
    
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  },
  
  /**
   * Blob을 파일로 다운로드 (file-saver 사용)
   * @param blob - 다운로드할 Blob
   * @param fileName - 파일 이름
   */
  downloadBlob(blob: Blob, fileName: string): void {
    saveAs(blob, fileName);
  },
  
  /**
   * 데이터 URL을 파일로 다운로드
   * @param dataUrl - 다운로드할 데이터 URL
   * @param fileName - 파일 이름
   */
  downloadDataUrl(dataUrl: string, fileName: string): void {
    // URL이 blob:로 시작하는 경우 (createObjectURL 결과)
    if (dataUrl.startsWith('blob:')) {
      fetch(dataUrl)
        .then(response => response.blob())
        .then(blob => {
          this.downloadBlob(blob, fileName);
          // URL 해제
          URL.revokeObjectURL(dataUrl);
        })
        .catch(error => {
          console.error('다운로드 오류:', error);
        });
    } else {
      // 일반 데이터 URL인 경우
      const blob = this.dataUrlToBlob(dataUrl);
      this.downloadBlob(blob, fileName);
    }
  },
  
  /**
   * 캔버스 요소를 특정 형식으로 내보내기
   * @param canvas - 내보낼 캔버스
   * @param options - 내보내기 옵션
   * @returns 데이터 URL 또는 Blob
   */
  async exportCanvas(
    canvas: HTMLCanvasElement,
    options: {
      format: 'png' | 'jpeg' | 'svg' | 'pdf';
      quality?: number;
      fileName?: string;
      returnType?: 'dataURL' | 'blob';
    }
  ): Promise<string | Blob> {
    const { format, quality = 1.0, fileName, returnType = 'dataURL' } = options;
    
    let result: string | Blob;
    
    // 형식에 따른 처리
    if (format === 'png' || format === 'jpeg') {
      const dataUrl = canvas.toDataURL(`image/${format}`, quality);
      result = returnType === 'blob' ? this.dataUrlToBlob(dataUrl) : dataUrl;
    } else if (format === 'svg') {
      const dataUrl = await CanvasMerger.mergeAndExport([canvas], { format: 'svg' });
      result = returnType === 'blob' ? 
        (await fetch(dataUrl).then(res => res.blob())) : dataUrl;
    } else if (format === 'pdf') {
      const dataUrl = await CanvasMerger.mergeAndExport([canvas], { format: 'pdf' });
      result = returnType === 'blob' ? 
        (await fetch(dataUrl).then(res => res.blob())) : dataUrl;
    } else {
      throw new Error(`지원하지 않는 형식: ${format}`);
    }
    
    // 파일 이름이 제공된 경우 다운로드
    if (fileName && returnType === 'blob') {
      this.downloadBlob(result as Blob, fileName);
    } else if (fileName && returnType === 'dataURL') {
      this.downloadDataUrl(result as string, fileName);
    }
    
    return result;
  }
}; 