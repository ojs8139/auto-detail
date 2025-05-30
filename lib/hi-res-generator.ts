"use client";

/**
 * 고해상도 이미지 생성을 위한 유틸리티 클래스
 * 다양한 업스케일링 알고리즘과 품질 향상 기법을 제공합니다.
 */
export class HiResGenerator {
  /**
   * 이미지 URL을 고해상도로 변환
   * @param imageUrl - 변환할 이미지 URL
   * @param options - 변환 옵션
   * @returns 고해상도 이미지의 데이터 URL
   */
  public static async generateHiRes(
    imageUrl: string,
    options: {
      scale?: number;
      quality?: number;
      method?: 'bilinear' | 'bicubic' | 'lanczos';
      maxWidth?: number;
      maxHeight?: number;
      preserveAspectRatio?: boolean;
    } = {}
  ): Promise<string> {
    // 기본 옵션 설정
    const {
      scale = 2,
      quality = 1.0,
      method = 'bicubic',
      maxWidth = 4000,
      maxHeight = 4000,
      preserveAspectRatio = true
    } = options;
    
    // 이미지 로드
    const img = await this.loadImage(imageUrl);
    
    // 대상 크기 계산
    let targetWidth = Math.floor(img.width * scale);
    let targetHeight = Math.floor(img.height * scale);
    
    // 최대 크기 제한
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      if (preserveAspectRatio) {
        const aspectRatio = img.width / img.height;
        if (targetWidth > maxWidth) {
          targetWidth = maxWidth;
          targetHeight = Math.floor(maxWidth / aspectRatio);
        }
        if (targetHeight > maxHeight) {
          targetHeight = maxHeight;
          targetWidth = Math.floor(maxHeight * aspectRatio);
        }
      } else {
        targetWidth = Math.min(targetWidth, maxWidth);
        targetHeight = Math.min(targetHeight, maxHeight);
      }
    }
    
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 이미지 업스케일링 수행
    switch (method) {
      case 'bilinear':
        this.applyBilinearScaling(ctx, img, targetWidth, targetHeight);
        break;
      case 'lanczos':
        this.applyLanczosScaling(ctx, img, targetWidth, targetHeight);
        break;
      case 'bicubic':
      default:
        // bicubic 스케일링(기본값)
        this.applyBicubicScaling(ctx, img, targetWidth, targetHeight);
        break;
    }
    
    // 이미지 품질 향상
    this.enhanceImageQuality(ctx, targetWidth, targetHeight);
    
    // 데이터 URL로 변환
    return canvas.toDataURL('image/png', quality);
  }
  
  /**
   * 이미지 URL에서 이미지 객체 로드
   * @param imageUrl - 이미지 URL
   * @returns Promise<HTMLImageElement>
   */
  private static loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = imageUrl;
    });
  }
  
  /**
   * 이중 선형 보간법(Bilinear Interpolation)으로 이미지 스케일링
   * 단순하고 빠르지만 선명도가 다소 떨어질 수 있음
   */
  private static applyBilinearScaling(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): void {
    // 이미지 스무딩 활성화(기본 bilinear 알고리즘)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 캔버스에 이미지 그리기
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  }
  
  /**
   * 3차 보간법(Bicubic Interpolation)으로 이미지 스케일링
   * Bilinear보다 품질이 좋지만 더 많은 연산이 필요함
   */
  private static applyBicubicScaling(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): void {
    // 캔버스 2D 컨텍스트는 Bicubic 스케일링을 직접 지원하지 않으므로
    // 단계적 확대를 통해 근사치 구현
    
    // 중간 캔버스 생성 (단계적 확대를 위해)
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // 초기 크기 설정
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    
    // 원본 이미지 그리기
    tempCtx.drawImage(img, 0, 0);
    
    // 단계적 스케일링 (단계별로 최대 1.5배 확대)
    let currentWidth = img.width;
    let currentHeight = img.height;
    const maxStepScale = 1.5;
    
    while (currentWidth < targetWidth || currentHeight < targetHeight) {
      // 다음 단계 크기 계산
      const nextWidth = Math.min(currentWidth * maxStepScale, targetWidth);
      const nextHeight = Math.min(currentHeight * maxStepScale, targetHeight);
      
      // 임시 캔버스 생성
      const stepCanvas = document.createElement('canvas');
      stepCanvas.width = nextWidth;
      stepCanvas.height = nextHeight;
      const stepCtx = stepCanvas.getContext('2d')!;
      
      // 고품질 스케일링 설정
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      
      // 이전 단계 이미지를 새 크기로 그리기
      stepCtx.drawImage(tempCanvas, 0, 0, nextWidth, nextHeight);
      
      // 임시 캔버스 업데이트
      tempCanvas.width = nextWidth;
      tempCanvas.height = nextHeight;
      tempCtx.drawImage(stepCanvas, 0, 0);
      
      // 현재 크기 업데이트
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }
    
    // 최종 결과를 대상 캔버스에 그리기
    ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  }
  
  /**
   * Lanczos 알고리즘으로 이미지 스케일링
   * 높은 품질의 결과를 제공하지만 계산 비용이 높음
   */
  private static applyLanczosScaling(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
  ): void {
    // Lanczos는 복잡한 알고리즘이므로 단계적 확대로 근사치 구현
    
    // 중간 캔버스 생성
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    
    // 초기 크기 설정
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    
    // 원본 이미지 그리기
    tempCtx.drawImage(img, 0, 0);
    
    // 더 작은 스텝으로 단계적 스케일링 (Lanczos 근사치)
    let currentWidth = img.width;
    let currentHeight = img.height;
    const maxStepScale = 1.2; // Lanczos에서는 더 작은 스텝 사용
    
    while (currentWidth < targetWidth || currentHeight < targetHeight) {
      // 다음 단계 크기 계산
      const nextWidth = Math.min(currentWidth * maxStepScale, targetWidth);
      const nextHeight = Math.min(currentHeight * maxStepScale, targetHeight);
      
      // 임시 캔버스 생성
      const stepCanvas = document.createElement('canvas');
      stepCanvas.width = nextWidth;
      stepCanvas.height = nextHeight;
      const stepCtx = stepCanvas.getContext('2d')!;
      
      // 고품질 스케일링 설정
      stepCtx.imageSmoothingEnabled = true;
      stepCtx.imageSmoothingQuality = 'high';
      
      // 이전 단계 이미지를 새 크기로 그리기
      stepCtx.drawImage(tempCanvas, 0, 0, nextWidth, nextHeight);
      
      // 임시 캔버스 업데이트
      tempCanvas.width = nextWidth;
      tempCanvas.height = nextHeight;
      tempCtx.drawImage(stepCanvas, 0, 0);
      
      // 현재 크기 업데이트
      currentWidth = nextWidth;
      currentHeight = nextHeight;
    }
    
    // 선명도 향상 필터 적용
    this.applySharpeningFilter(tempCtx, tempCanvas.width, tempCanvas.height);
    
    // 최종 결과를 대상 캔버스에 그리기
    ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
  }
  
  /**
   * 이미지 품질 향상 처리
   * 선명도 및 색상 보정 적용
   */
  private static enhanceImageQuality(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    // 선명도 향상
    this.applySharpeningFilter(ctx, width, height);
    
    // 대비 향상
    this.applyContrastEnhancement(ctx, width, height, 1.1);
  }
  
  /**
   * 선명도 향상 필터 적용
   * 언샤프 마스킹(Unsharp Masking) 기법 활용
   */
  private static applySharpeningFilter(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    amount: number = 0.5
  ): void {
    // 이미지 데이터 가져오기
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 복사본 생성 (원본 흐리게 처리용)
    const blurredData = new Uint8ClampedArray(data);
    
    // 3x3 가우시안 블러 적용 (분리된 패스)
    this.applyGaussianBlur(blurredData, width, height);
    
    // 언샤프 마스킹 적용
    for (let i = 0; i < data.length; i += 4) {
      // 각 채널(R,G,B)에 언샤프 마스킹 적용
      for (let j = 0; j < 3; j++) {
        // 원본 - 블러 = 디테일
        const detail = data[i + j] - blurredData[i + j];
        // 원본 + (디테일 × 강도) = 선명한 이미지
        data[i + j] = Math.max(0, Math.min(255, data[i + j] + detail * amount));
      }
      // 알파 채널은 유지
    }
    
    // 처리된 이미지 데이터 적용
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * 가우시안 블러 필터 적용 (3x3)
   * 선명도 향상을 위한 보조 함수
   */
  private static applyGaussianBlur(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): void {
    // 임시 버퍼
    const tempData = new Uint8ClampedArray(data.length);
    
    // 가우시안 커널 계수 (1D 분리)
    const kernel = [0.25, 0.5, 0.25];
    
    // 수평 패스
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          
          for (let kx = -1; kx <= 1; kx++) {
            const px = Math.max(0, Math.min(width - 1, x + kx));
            const pi = (y * width + px) * 4;
            sum += data[pi + c] * kernel[kx + 1];
          }
          
          tempData[i + c] = sum;
        }
        
        // 알파 채널 복사
        tempData[i + 3] = data[i + 3];
      }
    }
    
    // 수직 패스
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          
          for (let ky = -1; ky <= 1; ky++) {
            const py = Math.max(0, Math.min(height - 1, y + ky));
            const pi = (py * width + x) * 4;
            sum += tempData[pi + c] * kernel[ky + 1];
          }
          
          data[i + c] = sum;
        }
      }
    }
  }
  
  /**
   * 대비 향상 필터 적용
   */
  private static applyContrastEnhancement(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    factor: number = 1.1
  ): void {
    // 이미지 데이터 가져오기
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 중간값(128)을 기준으로 대비 조정
    const midpoint = 128;
    
    for (let i = 0; i < data.length; i += 4) {
      // RGB 채널에만 적용
      for (let j = 0; j < 3; j++) {
        // 대비 공식: (픽셀값 - 중간값) × 계수 + 중간값
        data[i + j] = Math.max(0, Math.min(255, 
          (data[i + j] - midpoint) * factor + midpoint
        ));
      }
      // 알파 채널은 유지
    }
    
    // 처리된 이미지 데이터 적용
    ctx.putImageData(imageData, 0, 0);
  }
  
  /**
   * 캔버스 내용을 고해상도 이미지로 변환
   * @param canvas - 원본 캔버스
   * @param options - 변환 옵션
   * @returns 고해상도 이미지의 데이터 URL
   */
  public static async canvasToHiRes(
    canvas: HTMLCanvasElement,
    options: {
      scale?: number;
      quality?: number;
      method?: 'bilinear' | 'bicubic' | 'lanczos';
    } = {}
  ): Promise<string> {
    // 먼저 캔버스를 데이터 URL로 변환
    const dataUrl = canvas.toDataURL('image/png');
    
    // 이미지 업스케일링을 위해 비동기 메서드 호출
    return await this.generateHiRes(dataUrl, options);
  }
  
  /**
   * 고해상도 이미지 생성 옵션을 기반으로 예상 파일 크기 계산
   * @param width - 원본 이미지 너비
   * @param height - 원본 이미지 높이
   * @param options - 변환 옵션
   * @returns 예상 파일 크기 (바이트)
   */
  public static estimateFileSize(
    width: number,
    height: number,
    options: {
      scale?: number;
      quality?: number;
      format?: 'png' | 'jpeg';
    } = {}
  ): number {
    const { scale = 2, quality = 1.0, format = 'png' } = options;
    
    // 대상 크기 계산
    const targetWidth = Math.floor(width * scale);
    const targetHeight = Math.floor(height * scale);
    
    // 픽셀당 바이트 수 (PNG: 4, JPEG: 품질에 따라 다름)
    let bytesPerPixel = 4; // PNG 기본값
    
    if (format === 'jpeg') {
      // JPEG의 경우 품질에 따라 압축률이 달라짐
      // 품질 1.0 = 약 0.7 bytes/px, 품질 0.1 = 약 0.1 bytes/px
      bytesPerPixel = 0.1 + quality * 0.6;
    }
    
    // 예상 파일 크기 계산
    return Math.ceil(targetWidth * targetHeight * bytesPerPixel);
  }
}

/**
 * 고해상도 이미지 생성을 위한 유틸리티 함수 모음
 */
export const HiResUtils = {
  /**
   * 이미지를 특정 크기로 조정
   * @param dataUrl - 이미지 데이터 URL
   * @param width - 목표 너비
   * @param height - 목표 높이
   * @param quality - 이미지 품질 (0.0 ~ 1.0)
   * @returns 리사이즈된 이미지의 데이터 URL
   */
  async resizeImage(
    dataUrl: string,
    width: number,
    height: number,
    quality: number = 1.0
  ): Promise<string> {
    // 이미지 로드
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
    
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 이미지 그리기
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);
    
    // 데이터 URL로 변환
    return canvas.toDataURL('image/png', quality);
  },
  
  /**
   * 이미지 해상도 정보 가져오기
   * @param dataUrl - 이미지 데이터 URL
   * @returns 이미지 정보 (너비, 높이, 해상도)
   */
  async getImageInfo(dataUrl: string): Promise<{
    width: number;
    height: number;
    aspectRatio: number;
    size: number;
  }> {
    // 이미지 로드
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = dataUrl;
    });
    
    // 크기 계산
    const size = Math.ceil(dataUrl.length * 0.75); // Base64 인코딩 고려
    
    return {
      width: img.width,
      height: img.height,
      aspectRatio: img.width / img.height,
      size // 바이트 단위 근사치
    };
  },
  
  /**
   * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
   * @param bytes - 바이트 수
   * @returns 포맷된 문자열 (예: "1.23 MB")
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
  }
}; 