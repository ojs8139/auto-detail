/**
 * 이미지 캐싱 유틸리티
 * 이미지 로딩 성능을 개선하기 위한 캐싱 메커니즘을 제공합니다.
 */

// 메모리 캐시 (싱글턴 패턴)
class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, { image: HTMLImageElement; timestamp: number }>;
  private maxSize: number;
  private maxAge: number; // 캐시 항목 최대 수명 (밀리초)

  private constructor(maxSize = 100, maxAge = 24 * 60 * 60 * 1000) { // 기본 24시간
    this.cache = new Map();
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  public static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  /**
   * 이미지를 캐시에 추가
   */
  public set(key: string, image: HTMLImageElement): void {
    // 캐시 크기 제한 확인
    if (this.cache.size >= this.maxSize) {
      this.removeOldest();
    }

    this.cache.set(key, { 
      image, 
      timestamp: Date.now() 
    });
  }

  /**
   * 캐시에서 이미지 가져오기
   */
  public get(key: string): HTMLImageElement | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 캐시 항목 유효성 검사 (만료 여부)
    const now = Date.now();
    if (now - item.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    // 캐시 적중 시 타임스탬프 갱신
    item.timestamp = now;
    return item.image;
  }

  /**
   * 캐시에서 이미지 제거
   */
  public remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 캐시 비우기
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * 가장 오래된 캐시 항목 제거
   */
  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 캐시 통계 정보 반환
   */
  public getStats(): { size: number; maxSize: number; usage: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      usage: this.cache.size / this.maxSize
    };
  }
}

// 이미지 캐시 인스턴스
const imageCache = ImageCache.getInstance();

/**
 * 이미지 프리로드 함수
 * @param src 이미지 URL
 * @param options 이미지 로드 옵션
 * @returns Promise<HTMLImageElement>
 */
export function preloadImage(
  src: string,
  options: { crossOrigin?: string; priority?: boolean } = {}
): Promise<HTMLImageElement> {
  // 이미 캐시에 있는 경우 즉시 반환
  const cachedImage = imageCache.get(src);
  if (cachedImage) {
    return Promise.resolve(cachedImage);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (options.crossOrigin) {
      img.crossOrigin = options.crossOrigin;
    }
    
    img.onload = () => {
      // 캐시에 추가
      imageCache.set(src, img);
      resolve(img);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    // 우선순위가 높은 경우 fetchpriority 속성 설정
    if (options.priority) {
      // @ts-expect-error: fetchpriority는 최신 브라우저에서만 지원
      img.fetchpriority = 'high';
    }
    
    img.src = src;
  });
}

/**
 * 여러 이미지 프리로드 함수
 * @param sources 이미지 URL 배열
 * @param options 이미지 로드 옵션
 * @returns Promise<HTMLImageElement[]>
 */
export function preloadImages(
  sources: string[],
  options: { crossOrigin?: string; priority?: boolean } = {}
): Promise<HTMLImageElement[]> {
  return Promise.all(sources.map(src => preloadImage(src, options)));
}

/**
 * 이미지 URL 최적화 함수
 * @param url 이미지 URL
 * @param width 요청 너비
 * @param quality 품질 (1-100)
 * @returns 최적화된 이미지 URL
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  quality: number = 80
): string {
  // 데이터 URL이나 외부 URL은 최적화하지 않음
  if (url.startsWith('data:') || !url.startsWith('/')) {
    return url;
  }
  
  // Next.js 이미지 최적화 URL 생성
  const params = new URLSearchParams();
  
  if (width) {
    params.append('w', width.toString());
  }
  
  params.append('q', quality.toString());
  
  // URL에 쿼리 파라미터 추가
  return `/_next/image?url=${encodeURIComponent(url)}&${params.toString()}`;
}

export default imageCache; 