"use client";

/**
 * 이미지 최적화 및 압축 옵션 인터페이스
 */
export interface ImageOptimizationOptions {
  maxWidth?: number;      // 최대 너비
  maxHeight?: number;     // 최대 높이
  quality?: number;       // 품질 (0-1)
  format?: 'jpeg' | 'png' | 'webp'; // 출력 형식
  preserveAspectRatio?: boolean;    // 종횡비 유지 여부
  autoDetectFormat?: boolean;       // 이미지 내용에 맞는 형식 자동 감지
}

/**
 * 이미지 최적화 결과 인터페이스
 */
export interface ImageOptimizationResult {
  dataUrl: string;        // 최적화된 이미지 데이터 URL
  originalSize: number;   // 원본 크기 (바이트)
  optimizedSize: number;  // 최적화된 크기 (바이트)
  width: number;          // 너비
  height: number;         // 높이
  format: string;         // 형식
  compressionRatio: number; // 압축률 (%)
  quality: number;        // 적용된 품질 설정
}

/**
 * 이미지 최적화 및 압축 유틸리티 클래스
 */
export class ImageOptimizer {
  /**
   * 이미지 최적화 및 압축 수행
   * @param imageDataUrl 원본 이미지 데이터 URL
   * @param options 최적화 옵션
   * @returns 최적화 결과
   */
  public static async optimize(
    imageDataUrl: string,
    options: ImageOptimizationOptions = {}
  ): Promise<ImageOptimizationResult> {
    // 기본 옵션 설정
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.8,
      format = 'jpeg',
      preserveAspectRatio = true,
      autoDetectFormat = true
    } = options;

    // 원본 이미지 로드
    const originalImage = await this.loadImage(imageDataUrl);
    
    // 원본 크기 계산
    const originalSize = this.calculateDataUrlSize(imageDataUrl);
    
    // 이미지 리사이징
    const { canvas, width, height } = this.resizeImage(
      originalImage,
      maxWidth,
      maxHeight,
      preserveAspectRatio
    );
    
    // 이미지 형식 결정
    const outputFormat = autoDetectFormat
      ? this.detectOptimalFormat(canvas)
      : format;
    
    // 이미지 압축 및 변환
    const optimizedDataUrl = this.compressImage(canvas, outputFormat, quality);
    
    // 최적화된 크기 계산
    const optimizedSize = this.calculateDataUrlSize(optimizedDataUrl);
    
    // 압축률 계산
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100;
    
    // 결과 반환
    return {
      dataUrl: optimizedDataUrl,
      originalSize,
      optimizedSize,
      width,
      height,
      format: outputFormat,
      compressionRatio,
      quality
    };
  }
  
  /**
   * 이미지 로드
   * @param dataUrl 이미지 데이터 URL
   * @returns HTMLImageElement
   */
  private static loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = dataUrl;
    });
  }
  
  /**
   * 이미지 리사이징
   * @param img 이미지 엘리먼트
   * @param maxWidth 최대 너비
   * @param maxHeight 최대 높이
   * @param preserveAspectRatio 종횡비 유지 여부
   * @returns 리사이징된 캔버스와 크기
   */
  private static resizeImage(
    img: HTMLImageElement,
    maxWidth: number,
    maxHeight: number,
    preserveAspectRatio: boolean
  ): { canvas: HTMLCanvasElement; width: number; height: number } {
    let width = img.width;
    let height = img.height;
    
    // 리사이징 필요 여부 확인
    if (width > maxWidth || height > maxHeight) {
      if (preserveAspectRatio) {
        // 종횡비 유지하며 리사이징
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      } else {
        // 종횡비 무시하고 최대 크기로 리사이징
        width = Math.min(width, maxWidth);
        height = Math.min(height, maxHeight);
      }
    }
    
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // 이미지 그리기
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
    }
    
    return { canvas, width, height };
  }
  
  /**
   * 이미지 압축 및 형식 변환
   * @param canvas 이미지 캔버스
   * @param format 출력 형식
   * @param quality 품질 (0-1)
   * @returns 압축된 이미지 데이터 URL
   */
  private static compressImage(
    canvas: HTMLCanvasElement,
    format: 'jpeg' | 'png' | 'webp',
    quality: number
  ): string {
    const mimeType = `image/${format}`;
    return canvas.toDataURL(mimeType, quality);
  }
  
  /**
   * 이미지 내용에 최적인 형식 감지
   * @param canvas 이미지 캔버스
   * @returns 최적 형식
   */
  private static detectOptimalFormat(canvas: HTMLCanvasElement): 'jpeg' | 'png' | 'webp' {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'jpeg';
    
    // 투명도 확인 (투명 픽셀이 있으면 PNG 사용)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // 투명도 및 색상 분포 확인
    let hasTransparency = false;
    let colorCount = 0;
    const colorMap = new Map<string, number>();
    
    for (let i = 0; i < data.length; i += 4) {
      // 투명도 확인
      if (data[i + 3] < 255) {
        hasTransparency = true;
      }
      
      // 색상 분포 확인 (샘플링)
      if (i % 20 === 0) {
        const color = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }
    }
    
    colorCount = colorMap.size;
    
    // 형식 결정
    if (hasTransparency) {
      return 'png'; // 투명도가 있으면 PNG
    }
    
    if (colorCount < 256 && canvas.width * canvas.height < 300000) {
      return 'png'; // 색상이 적고 이미지가 작으면 PNG
    }
    
    // WebP 지원 확인
    const isWebPSupported = typeof HTMLCanvasElement.prototype.toDataURL === 'function' && 
      canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    
    return isWebPSupported ? 'webp' : 'jpeg';
  }
  
  /**
   * 데이터 URL 크기 계산 (바이트)
   * @param dataUrl 데이터 URL
   * @returns 크기 (바이트)
   */
  public static calculateDataUrlSize(dataUrl: string): number {
    // Base64 부분 추출
    const base64 = dataUrl.split(',')[1];
    // Base64 디코딩 시 원래 크기는 약 3/4
    return Math.floor((base64.length * 3) / 4);
  }
  
  /**
   * 자동 품질 최적화 수행
   * 목표 파일 크기에 맞추어 품질 자동 조정
   * @param imageDataUrl 원본 이미지 데이터 URL
   * @param targetSize 목표 크기 (KB)
   * @param options 최적화 옵션
   * @returns 최적화 결과
   */
  public static async autoQualityOptimize(
    imageDataUrl: string,
    targetSize: number,
    options: Omit<ImageOptimizationOptions, 'quality'> = {}
  ): Promise<ImageOptimizationResult> {
    // 목표 크기를 바이트로 변환
    const targetBytes = targetSize * 1024;
    
    // 초기 품질 설정
    let minQuality = 0.1;
    let maxQuality = 1.0;
    let currentQuality = 0.7; // 시작 품질
    let bestResult: ImageOptimizationResult | null = null;
    
    // 이진 탐색으로 최적 품질 찾기 (최대 8회 시도)
    for (let i = 0; i < 8; i++) {
      const result = await this.optimize(imageDataUrl, {
        ...options,
        quality: currentQuality
      });
      
      // 첫 결과는 무조건 저장
      if (bestResult === null) {
        bestResult = result;
      }
      
      // 목표 크기에 더 가까운 결과 저장
      if (Math.abs(result.optimizedSize - targetBytes) < 
          Math.abs(bestResult.optimizedSize - targetBytes)) {
        bestResult = result;
      }
      
      // 목표 크기와 비교하여 품질 조정
      if (result.optimizedSize > targetBytes) {
        // 파일이 너무 큼 -> 품질 낮추기
        maxQuality = currentQuality;
        currentQuality = (minQuality + currentQuality) / 2;
      } else {
        // 파일이 목표보다 작음 -> 품질 높이기
        minQuality = currentQuality;
        currentQuality = (currentQuality + maxQuality) / 2;
      }
      
      // 목표 크기에 충분히 가까우면 중단
      if (Math.abs(result.optimizedSize - targetBytes) < targetBytes * 0.05) {
        break;
      }
    }
    
    return bestResult!;
  }
} 