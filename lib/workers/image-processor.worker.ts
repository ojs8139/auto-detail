/**
 * 이미지 처리 웹 워커
 * 무거운 이미지 처리 작업을 백그라운드에서 처리합니다.
 */

// 워커 내에서 사용할 메시지 타입 정의
type WorkerMessageType = 
  | 'resize'
  | 'crop'
  | 'rotate'
  | 'filter'
  | 'compress';

// 워커에게 전송할 메시지 인터페이스
interface WorkerMessage {
  type: WorkerMessageType;
  id: string;
  imageData: ImageData | ArrayBuffer;
  params: Record<string, unknown>;
}

// 워커가 반환할 결과 인터페이스
interface WorkerResult {
  id: string;
  type: WorkerMessageType;
  imageData: ImageData | ArrayBuffer;
  success: boolean;
  error?: string;
  processingTime?: number;
}

// 메인 스레드로부터 메시지 수신 처리
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, imageData, params } = event.data;
  const startTime = performance.now();
  
  try {
    let result: WorkerResult;
    
    switch (type) {
      case 'resize':
        result = await handleResize(id, imageData, params as { width: number; height: number });
        break;
      case 'crop':
        result = await handleCrop(id, imageData, params as { x: number; y: number; width: number; height: number });
        break;
      case 'rotate':
        result = await handleRotate(id, imageData, params as { angle: number });
        break;
      case 'filter':
        result = await handleFilter(id, imageData, params as { filter: string; options?: Record<string, unknown> });
        break;
      case 'compress':
        result = await handleCompress(id, imageData, params as { quality: number });
        break;
      default:
        throw new Error(`지원하지 않는 작업 타입: ${type}`);
    }
    
    // 처리 시간 추가
    result.processingTime = performance.now() - startTime;
    
    // 결과 반환
    const transferList: Transferable[] = [];
    
    // 전송할 데이터가 ArrayBuffer인 경우 Transferable 목록에 추가
    if (result.imageData instanceof ArrayBuffer) {
      transferList.push(result.imageData);
    } else if (result.imageData instanceof ImageData) {
      // ImageData의 버퍼도 전송 가능한 경우 추가
      transferList.push(result.imageData.data.buffer);
    }
    
    // postMessage 호출 시 타입 문제 해결
    // @ts-ignore - WorkerGlobalScope.postMessage는 MessagePort.postMessage와 타입이 다름
    self.postMessage(result, transferList);
    
  } catch (error) {
    // 에러 발생 시 에러 정보 반환
    self.postMessage({
      id,
      type,
      imageData: null,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processingTime: performance.now() - startTime
    });
  }
});

/**
 * 이미지 리사이즈 처리
 * @param id 작업 ID
 * @param imageData 이미지 데이터 (ImageData 또는 ArrayBuffer)
 * @param params 리사이즈 파라미터 (width, height)
 * @returns 리사이즈된 이미지 데이터
 */
async function handleResize(id: string, imageData: ImageData | ArrayBuffer, params: { width: number; height: number }): Promise<WorkerResult> {
  const { width, height } = params;
  
  try {
    // 비트맵 이미지 생성
    let imageBitmap: ImageBitmap;
    
    if (imageData instanceof ImageData) {
      // ImageData에서 비트맵 생성
      imageBitmap = await createImageBitmap(imageData);
    } else {
      // ArrayBuffer에서 비트맵 생성 (바이너리 데이터를 Blob으로 변환 후 처리)
      const blob = new Blob([imageData], { type: 'image/png' });
      imageBitmap = await createImageBitmap(blob);
    }
    
    // 캔버스 생성 및 이미지 그리기
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 캔버스에 이미지 그리기 (리사이즈)
    ctx.drawImage(imageBitmap, 0, 0, width, height);
    
    // 처리된 이미지 데이터 반환
    const resizedImageData = ctx.getImageData(0, 0, width, height);
    
    return {
      id,
      type: 'resize',
      imageData: resizedImageData,
      success: true
    };
  } catch (error) {
    console.error('이미지 리사이즈 오류:', error);
    
    // 오류 발생 시 빈 이미지 데이터 반환
    return {
      id,
      type: 'resize',
      imageData: new ImageData(width, height),
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 이미지 크롭 처리
 * @param id 작업 ID
 * @param imageData 이미지 데이터
 * @param params 크롭 파라미터 (x, y, width, height)
 * @returns 크롭된 이미지 데이터
 */
async function handleCrop(id: string, imageData: ImageData | ArrayBuffer, params: { x: number; y: number; width: number; height: number }): Promise<WorkerResult> {
  const { x, y, width, height } = params;
  
  try {
    // 비트맵 이미지 생성
    let imageBitmap: ImageBitmap;
    
    if (imageData instanceof ImageData) {
      imageBitmap = await createImageBitmap(imageData);
    } else {
      const blob = new Blob([imageData], { type: 'image/png' });
      imageBitmap = await createImageBitmap(blob);
    }
    
    // 캔버스 생성 및 이미지 크롭
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 이미지의 특정 영역만 캔버스에 그리기
    ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);
    
    // 처리된 이미지 데이터 반환
    const croppedImageData = ctx.getImageData(0, 0, width, height);
    
    return {
      id,
      type: 'crop',
      imageData: croppedImageData,
      success: true
    };
  } catch (error) {
    console.error('이미지 크롭 오류:', error);
    
    return {
      id,
      type: 'crop',
      imageData: new ImageData(width, height),
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 이미지 회전 처리
 * @param id 작업 ID
 * @param imageData 이미지 데이터
 * @param params 회전 파라미터 (angle: 각도(도))
 * @returns 회전된 이미지 데이터
 */
async function handleRotate(id: string, imageData: ImageData | ArrayBuffer, params: { angle: number }): Promise<WorkerResult> {
  const { angle } = params;
  const angleRadians = (angle * Math.PI) / 180; // 각도를 라디안으로 변환
  
  try {
    // 비트맵 이미지 생성
    let imageBitmap: ImageBitmap;
    
    if (imageData instanceof ImageData) {
      imageBitmap = await createImageBitmap(imageData);
    } else {
      const blob = new Blob([imageData], { type: 'image/png' });
      imageBitmap = await createImageBitmap(blob);
    }
    
    const { width, height } = imageBitmap;
    
    // 회전된 이미지의 새 크기 계산 (회전 시 이미지가 잘리지 않도록)
    const newWidth = Math.abs(width * Math.cos(angleRadians)) + Math.abs(height * Math.sin(angleRadians));
    const newHeight = Math.abs(width * Math.sin(angleRadians)) + Math.abs(height * Math.cos(angleRadians));
    
    // 캔버스 생성
    const canvas = new OffscreenCanvas(newWidth, newHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 회전 변환 적용
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(angleRadians);
    ctx.drawImage(imageBitmap, -width / 2, -height / 2, width, height);
    
    // 처리된 이미지 데이터 반환
    const rotatedImageData = ctx.getImageData(0, 0, newWidth, newHeight);
    
    return {
      id,
      type: 'rotate',
      imageData: rotatedImageData,
      success: true
    };
  } catch (error) {
    console.error('이미지 회전 오류:', error);
    
    return {
      id,
      type: 'rotate',
      imageData: new ImageData(100, 100), // 기본 크기 제공
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 이미지 필터 처리
 * @param id 작업 ID
 * @param imageData 이미지 데이터
 * @param params 필터 파라미터 (filter: 필터 종류, options: 필터 옵션)
 * @returns 필터가 적용된 이미지 데이터
 */
async function handleFilter(id: string, imageData: ImageData | ArrayBuffer, params: { filter: string; options?: Record<string, unknown> }): Promise<WorkerResult> {
  const { filter, options = {} } = params;
  
  try {
    // 비트맵 이미지 생성
    let imageBitmap: ImageBitmap;
    
    if (imageData instanceof ImageData) {
      imageBitmap = await createImageBitmap(imageData);
    } else {
      const blob = new Blob([imageData], { type: 'image/png' });
      imageBitmap = await createImageBitmap(blob);
    }
    
    const { width, height } = imageBitmap;
    
    // 캔버스 생성
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 이미지 그리기
    ctx.drawImage(imageBitmap, 0, 0);
    
    // 필터 적용
    const processedImageData = ctx.getImageData(0, 0, width, height);
    const data = processedImageData.data;
    
    switch (filter) {
      case 'grayscale':
        // 그레이스케일 필터
        for (let i = 0; i < data.length; i += 4) {
          const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
          data[i] = avg;     // R
          data[i + 1] = avg; // G
          data[i + 2] = avg; // B
        }
        break;
        
      case 'sepia':
        // 세피아 필터
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));     // R
          data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168)); // G
          data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131)); // B
        }
        break;
        
      case 'brightness':
        // 밝기 조절
        const brightness = typeof options.value === 'number' ? options.value : 0;
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, data[i] + brightness));     // R
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness)); // G
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness)); // B
        }
        break;
        
      case 'invert':
        // 색상 반전
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];         // R
          data[i + 1] = 255 - data[i + 1]; // G
          data[i + 2] = 255 - data[i + 2]; // B
        }
        break;
        
      default:
        // 필터가 지정되지 않은 경우 원본 반환
        break;
    }
    
    // 필터가 적용된 이미지 데이터 설정
    ctx.putImageData(processedImageData, 0, 0);
    
    // 처리된 이미지 데이터 반환
    const filteredImageData = ctx.getImageData(0, 0, width, height);
    
    return {
      id,
      type: 'filter',
      imageData: filteredImageData,
      success: true
    };
  } catch (error) {
    console.error('이미지 필터 오류:', error);
    
    return {
      id,
      type: 'filter',
      imageData: new ImageData(100, 100),
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * 이미지 압축 처리
 * @param id 작업 ID
 * @param imageData 이미지 데이터
 * @param params 압축 파라미터 (quality: 압축 품질, 0-1 사이 값)
 * @returns 압축된 이미지 데이터 (ArrayBuffer)
 */
async function handleCompress(id: string, imageData: ImageData | ArrayBuffer, params: { quality: number }): Promise<WorkerResult> {
  const { quality } = params;
  
  try {
    // 비트맵 이미지 생성
    let imageBitmap: ImageBitmap;
    
    if (imageData instanceof ImageData) {
      imageBitmap = await createImageBitmap(imageData);
    } else {
      const blob = new Blob([imageData], { type: 'image/png' });
      imageBitmap = await createImageBitmap(blob);
    }
    
    const { width, height } = imageBitmap;
    
    // 캔버스 생성
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas 컨텍스트를 생성할 수 없습니다.');
    }
    
    // 이미지 그리기
    ctx.drawImage(imageBitmap, 0, 0);
    
    // 이미지를 Blob으로 변환 (압축 적용)
    const blob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: Math.max(0, Math.min(1, quality)) // 0-1 범위로 제한
    });
    
    // Blob을 ArrayBuffer로 변환
    const arrayBuffer = await blob.arrayBuffer();
    
    return {
      id,
      type: 'compress',
      imageData: arrayBuffer,
      success: true
    };
  } catch (error) {
    console.error('이미지 압축 오류:', error);
    
    return {
      id,
      type: 'compress',
      imageData: new ArrayBuffer(0),
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 