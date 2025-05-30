"use client";

/**
 * 이미지 메타데이터 인터페이스
 */
export interface ImageMetadata {
  width: number;        // 이미지 너비
  height: number;       // 이미지 높이
  format: string;       // 이미지 형식 (jpeg, png, webp 등)
  size?: number;        // 파일 크기 (바이트)
  aspectRatio?: number; // 가로세로 비율
  created?: string;     // 생성 일자
  modified?: string;    // 수정 일자
  description?: string; // 이미지 설명
  alt?: string;         // 대체 텍스트
  title?: string;       // 제목
  credit?: string;      // 크레딧/출처
  tags?: string[];      // 태그
  location?: {          // 위치 정보
    latitude?: number;
    longitude?: number;
    name?: string;
  };
  colors?: string[];    // 주요 색상
  custom?: Record<string, any>; // 사용자 정의 메타데이터
  lastEdited?: {        // 마지막 편집 정보
    date: string;
    action: string;
    tool?: string;
  };
}

/**
 * 이미지 메타데이터 추출 옵션
 */
export interface MetadataExtractionOptions {
  extractColors?: boolean;   // 주요 색상 추출 여부
  maxColors?: number;        // 추출할 최대 색상 수
  includeExif?: boolean;     // EXIF 데이터 포함 여부
  includeIptc?: boolean;     // IPTC 데이터 포함 여부
  colorModel?: 'rgb' | 'hex' | 'hsl'; // 색상 모델
}

/**
 * 이미지 메타데이터 관리 유틸리티 클래스
 */
export class MetadataManager {
  /**
   * 이미지에서 메타데이터 추출
   * @param imageUrl 이미지 URL 또는 데이터 URL
   * @param options 추출 옵션
   * @returns 메타데이터 객체
   */
  public static async extractMetadata(
    imageUrl: string,
    options: MetadataExtractionOptions = {}
  ): Promise<ImageMetadata> {
    // 기본 옵션 설정
    const {
      extractColors = false,
      maxColors = 5,
      includeExif = false,
      includeIptc = false,
      colorModel = 'hex'
    } = options;
    
    // 기본 메타데이터 추출
    const metadata = await this.extractBasicMetadata(imageUrl);
    
    // 색상 추출 (요청된 경우)
    if (extractColors) {
      metadata.colors = await this.extractDominantColors(imageUrl, maxColors, colorModel);
    }
    
    // EXIF 데이터 추출 (요청된 경우)
    if (includeExif) {
      const exifData = await this.extractExifData(imageUrl);
      if (exifData) {
        // 날짜 정보
        if (exifData.DateTimeOriginal) {
          metadata.created = exifData.DateTimeOriginal;
        }
        
        // 위치 정보
        if (exifData.GPSLatitude && exifData.GPSLongitude) {
          metadata.location = {
            latitude: exifData.GPSLatitude,
            longitude: exifData.GPSLongitude
          };
        }
        
        // 기타 유용한 EXIF 데이터
        metadata.custom = metadata.custom || {};
        metadata.custom.exif = {
          make: exifData.Make,
          model: exifData.Model,
          exposureTime: exifData.ExposureTime,
          fNumber: exifData.FNumber,
          iso: exifData.ISO,
          focalLength: exifData.FocalLength
        };
      }
    }
    
    // IPTC 데이터 추출 (요청된 경우)
    if (includeIptc) {
      const iptcData = await this.extractIptcData(imageUrl);
      if (iptcData) {
        // 제목, 설명, 태그 등
        if (iptcData.headline) metadata.title = iptcData.headline;
        if (iptcData.caption) metadata.description = iptcData.caption;
        if (iptcData.keywords) metadata.tags = iptcData.keywords;
        if (iptcData.credit) metadata.credit = iptcData.credit;
        
        // 기타 IPTC 데이터
        metadata.custom = metadata.custom || {};
        metadata.custom.iptc = {
          copyright: iptcData.copyright,
          source: iptcData.source,
          objectName: iptcData.objectName
        };
      }
    }
    
    // 마지막 편집 정보 추가
    metadata.lastEdited = {
      date: new Date().toISOString(),
      action: 'metadata_extraction'
    };
    
    return metadata;
  }
  
  /**
   * 기본 이미지 메타데이터 추출
   * @param imageUrl 이미지 URL
   * @returns 기본 메타데이터
   */
  private static async extractBasicMetadata(imageUrl: string): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        // 파일 형식 추출
        let format = 'unknown';
        if (imageUrl.startsWith('data:image/')) {
          format = imageUrl.split(';')[0].split('/')[1];
        } else {
          const ext = imageUrl.split('.').pop()?.toLowerCase() || '';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(ext)) {
            format = ext === 'jpg' ? 'jpeg' : ext;
          }
        }
        
        // 크기 계산 (데이터 URL인 경우)
        let size: number | undefined;
        if (imageUrl.startsWith('data:')) {
          const base64 = imageUrl.split(',')[1];
          size = Math.floor((base64.length * 3) / 4);
        }
        
        // 메타데이터 생성
        const aspectRatio = img.width / img.height;
        const metadata: ImageMetadata = {
          width: img.width,
          height: img.height,
          format,
          size,
          aspectRatio,
          created: new Date().toISOString()
        };
        
        resolve(metadata);
      };
      
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };
      
      // 이미지 로드 시작
      img.src = imageUrl;
    });
  }
  
  /**
   * 이미지에서 주요 색상 추출
   * @param imageUrl 이미지 URL
   * @param maxColors 추출할 최대 색상 수
   * @param colorModel 색상 모델
   * @returns 색상 배열
   */
  private static async extractDominantColors(
    imageUrl: string,
    maxColors: number = 5,
    colorModel: 'rgb' | 'hex' | 'hsl' = 'hex'
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // 캔버스 생성 및 이미지 그리기
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('캔버스 컨텍스트를 생성할 수 없습니다.');
          }
          
          // 분석을 위해 이미지 크기 조정 (성능 최적화)
          const maxSize = 100;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const width = Math.floor(img.width * scale);
          const height = Math.floor(img.height * scale);
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // 픽셀 데이터 가져오기
          const imageData = ctx.getImageData(0, 0, width, height);
          const pixels = imageData.data;
          
          // 색상 빈도 계산
          const colorCounts: Record<string, number> = {};
          
          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];
            
            // 투명 픽셀 제외
            if (a < 128) continue;
            
            // 색상 양자화 (유사한 색상 그룹화)
            const quantizedR = Math.round(r / 8) * 8;
            const quantizedG = Math.round(g / 8) * 8;
            const quantizedB = Math.round(b / 8) * 8;
            
            const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
            colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1;
          }
          
          // 빈도별 정렬
          const sortedColors = Object.entries(colorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxColors)
            .map(([color]) => {
              const [r, g, b] = color.split(',').map(Number);
              
              // 색상 모델에 따라 변환
              switch (colorModel) {
                case 'rgb':
                  return `rgb(${r}, ${g}, ${b})`;
                case 'hsl':
                  const [h, s, l] = this.rgbToHsl(r, g, b);
                  return `hsl(${h}, ${s}%, ${l}%)`;
                case 'hex':
                default:
                  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
              }
            });
          
          resolve(sortedColors);
        } catch (error) {
          console.error('색상 추출 오류:', error);
          resolve([]);
        }
      };
      
      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다.'));
      };
      
      // 이미지 로드 시작
      img.src = imageUrl;
    });
  }
  
  /**
   * RGB 색상을 HSL로 변환
   * @param r 빨강 (0-255)
   * @param g 초록 (0-255)
   * @param b 파랑 (0-255)
   * @returns [색상(0-360), 채도(0-100), 명도(0-100)]
   */
  private static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      
      h /= 6;
    }
    
    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100)
    ];
  }
  
  /**
   * EXIF 데이터 추출 (간소화된 구현)
   * 참고: 실제 구현에서는 exif-js와 같은 라이브러리 사용 권장
   */
  private static async extractExifData(imageUrl: string): Promise<any> {
    // 브라우저 환경에서 EXIF 데이터 추출은 제한적임
    // 데이터 URL에서는 EXIF 데이터가 보존되지 않음
    
    // 이 구현은 간소화된 더미 버전임
    // 실제로는 File 객체나 서버 측 구현 필요
    return null;
  }
  
  /**
   * IPTC 데이터 추출 (간소화된 구현)
   */
  private static async extractIptcData(imageUrl: string): Promise<any> {
    // IPTC 데이터 추출도 제한적임
    // 실제로는 서버 측 구현 필요
    return null;
  }
  
  /**
   * 이미지 데이터 URL에 메타데이터 임베딩
   * 참고: 실제로는 Data URL에 메타데이터를 직접 임베딩하는 것이 제한적임
   * 이 함수는 별도 저장을 위한 객체 반환
   * 
   * @param dataUrl 이미지 데이터 URL
   * @param metadata 메타데이터
   * @returns 메타데이터가 포함된 객체
   */
  public static embedMetadata(
    dataUrl: string,
    metadata: ImageMetadata
  ): { dataUrl: string; metadata: ImageMetadata } {
    // 메타데이터 업데이트
    const updatedMetadata = {
      ...metadata,
      lastEdited: {
        date: new Date().toISOString(),
        action: 'metadata_update'
      }
    };
    
    // 데이터 URL과 메타데이터 쌍으로 반환
    return {
      dataUrl,
      metadata: updatedMetadata
    };
  }
  
  /**
   * 두 메타데이터 병합
   * @param original 원본 메타데이터
   * @param updates 업데이트할 메타데이터
   * @returns 병합된 메타데이터
   */
  public static mergeMetadata(
    original: ImageMetadata,
    updates: Partial<ImageMetadata>
  ): ImageMetadata {
    // 현재 시간
    const now = new Date().toISOString();
    
    // 커스텀 필드 병합
    const mergedCustom = {
      ...(original.custom || {}),
      ...(updates.custom || {})
    };
    
    // 마지막 편집 정보 업데이트
    const lastEdited = {
      date: now,
      action: 'metadata_merge',
      ...updates.lastEdited
    };
    
    // 메타데이터 병합
    return {
      ...original,
      ...updates,
      modified: now,
      custom: mergedCustom,
      lastEdited
    };
  }
  
  /**
   * 메타데이터 JSON 문자열로 직렬화
   * @param metadata 메타데이터
   * @returns JSON 문자열
   */
  public static serializeMetadata(metadata: ImageMetadata): string {
    return JSON.stringify(metadata);
  }
  
  /**
   * JSON 문자열에서 메타데이터 역직렬화
   * @param jsonStr JSON 문자열
   * @returns 메타데이터 객체
   */
  public static deserializeMetadata(jsonStr: string): ImageMetadata {
    try {
      return JSON.parse(jsonStr) as ImageMetadata;
    } catch (error) {
      console.error('메타데이터 역직렬화 오류:', error);
      throw new Error('메타데이터 형식이 올바르지 않습니다.');
    }
  }
} 