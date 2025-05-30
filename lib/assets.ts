"use client";

import { ImageAsset, TextContent } from './types';
import { generateId } from './storage';
import { 
  STORES, 
  addData, 
  updateData, 
  getAllData, 
  getDataByIndex, 
  deleteData, 
  getData,
  migrateFromLocalStorage
} from './idb';

// 로컬 스토리지 키 정의 (마이그레이션 및 폴백용)
const IMAGE_ASSETS_KEY = 'detail-auto-create-images';
const TEXT_CONTENTS_KEY = 'detail-auto-create-texts';
const SHOP_URLS_KEY = 'detail-auto-create-urls';

// 초기 실행 시 마이그레이션 수행
if (typeof window !== 'undefined') {
  (async function() {
    try {
      // 이미지 데이터 마이그레이션
      await migrateFromLocalStorage(IMAGE_ASSETS_KEY, STORES.IMAGES);
      
      // 텍스트 데이터 마이그레이션
      await migrateFromLocalStorage(TEXT_CONTENTS_KEY, STORES.TEXTS);
      
      // URL 데이터 마이그레이션
      await migrateFromLocalStorage(SHOP_URLS_KEY, STORES.SHOP_URLS, (urlsMap) => {
        // URL 맵을 객체 배열로 변환
        return Object.entries(urlsMap).map(([projectId, url]) => ({
          projectId,
          url
        }));
      });
      
      console.log('데이터 마이그레이션 완료');
    } catch (error) {
      console.error('데이터 마이그레이션 오류:', error);
    }
  })();
}

/**
 * 이미지 자산 가져오기
 */
export async function getProjectImages(projectId: string): Promise<ImageAsset[]> {
  try {
    // IndexedDB에서 projectId로 이미지 가져오기
    return await getDataByIndex<ImageAsset>(STORES.IMAGES, 'projectId', projectId);
  } catch (error) {
    console.error('이미지 자산 불러오기 오류:', error);
    
    // 폴백: 로컬 스토리지에서 시도
    if (typeof window !== 'undefined') {
      try {
        const assets = localStorage.getItem(IMAGE_ASSETS_KEY);
        const allAssets = assets ? JSON.parse(assets) : [];
        return allAssets.filter((asset: ImageAsset) => asset.projectId === projectId);
      } catch (e) {
        console.error('로컬 스토리지 폴백 오류:', e);
      }
    }
    
    return [];
  }
}

/**
 * 이미지 자산 저장
 */
export async function saveImageAsset(
  projectId: string, 
  file: File, 
  dataUrl: string, 
  type: 'product' | 'background' | 'other' = 'product'
): Promise<ImageAsset> {
  // 이미지 크기 최적화 (데이터 URL이 너무 클 경우)
  const optimizedDataUrl = await optimizeImageDataUrl(dataUrl, 1200); // 최대 1200px로 제한
  
  const newAsset: ImageAsset = {
    id: generateId(),
    projectId,
    url: optimizedDataUrl,
    path: optimizedDataUrl,
    type,
    metadata: {
      width: 0, // 실제 구현에서는 이미지 로드 후 너비 추출
      height: 0, // 실제 구현에서는 이미지 로드 후 높이 추출
      format: file.type,
      size: file.size,
    },
  };
  
  try {
    // IndexedDB에 이미지 저장
    await addData(STORES.IMAGES, newAsset);
    return newAsset;
  } catch (error) {
    console.error('이미지 자산 저장 오류:', error);
    throw error;
  }
}

/**
 * 이미지 자산 삭제
 */
export async function deleteImageAsset(id: string): Promise<boolean> {
  try {
    // IndexedDB에서 이미지 삭제
    return await deleteData(STORES.IMAGES, id);
  } catch (error) {
    console.error('이미지 자산 삭제 오류:', error);
    
    // 폴백: 로컬 스토리지에서 시도
    if (typeof window !== 'undefined') {
      try {
        const assets = localStorage.getItem(IMAGE_ASSETS_KEY);
        if (!assets) return false;
        
        const allAssets = JSON.parse(assets);
        const filteredAssets = allAssets.filter((asset: ImageAsset) => asset.id !== id);
        
        if (filteredAssets.length === allAssets.length) {
          return false;
        }
        
        localStorage.setItem(IMAGE_ASSETS_KEY, JSON.stringify(filteredAssets));
        return true;
      } catch (e) {
        console.error('로컬 스토리지 폴백 오류:', e);
      }
    }
    
    return false;
  }
}

/**
 * 이미지 최적화 함수 (데이터 URL 크기 축소)
 */
function optimizeImageDataUrl(dataUrl: string, maxDimension: number = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 원본 크기가 최대 크기보다 작으면 그대로 반환
      if (img.width <= maxDimension && img.height <= maxDimension) {
        resolve(dataUrl);
        return;
      }
      
      // 비율 계산
      const ratio = Math.min(maxDimension / img.width, maxDimension / img.height);
      const width = Math.floor(img.width * ratio);
      const height = Math.floor(img.height * ratio);
      
      // 캔버스에 이미지 그리기
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(dataUrl); // 캔버스 컨텍스트를 얻을 수 없으면 원본 반환
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // 최적화된 데이터 URL 반환 (JPEG 포맷으로 변환하여 크기 감소)
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve(optimizedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('이미지 최적화 실패'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * 텍스트 콘텐츠 가져오기
 */
export async function getProjectTexts(projectId: string): Promise<TextContent[]> {
  try {
    // IndexedDB에서 projectId로 텍스트 가져오기
    return await getDataByIndex<TextContent>(STORES.TEXTS, 'projectId', projectId);
  } catch (error) {
    console.error('텍스트 콘텐츠 불러오기 오류:', error);
    
    // 폴백: 로컬 스토리지에서 시도
    if (typeof window !== 'undefined') {
      try {
        const texts = localStorage.getItem(TEXT_CONTENTS_KEY);
        const allTexts = texts ? JSON.parse(texts) : [];
        return allTexts.filter((text: TextContent) => text.projectId === projectId);
      } catch (e) {
        console.error('로컬 스토리지 폴백 오류:', e);
      }
    }
    
    return [];
  }
}

/**
 * 텍스트 콘텐츠 저장
 */
export async function saveTextContent(
  projectId: string, 
  content: string, 
  type: 'heading' | 'body' | 'bullet' | 'callout' = 'body'
): Promise<TextContent> {
  const newText: TextContent = {
    id: generateId(),
    projectId,
    content,
    type,
  };
  
  try {
    // IndexedDB에 텍스트 저장
    await addData(STORES.TEXTS, newText);
    return newText;
  } catch (error) {
    console.error('텍스트 콘텐츠 저장 오류:', error);
    throw error;
  }
}

/**
 * 텍스트 콘텐츠 삭제
 */
export async function deleteTextContent(id: string): Promise<boolean> {
  try {
    // IndexedDB에서 텍스트 삭제
    return await deleteData(STORES.TEXTS, id);
  } catch (error) {
    console.error('텍스트 콘텐츠 삭제 오류:', error);
    return false;
  }
}

/**
 * 쇼핑몰 URL 가져오기
 */
export async function getShopUrl(projectId: string): Promise<string | null> {
  try {
    // IndexedDB에서 URL 가져오기
    const urlData = await getData<{projectId: string, url: string}>(STORES.SHOP_URLS, projectId);
    return urlData ? urlData.url : null;
  } catch (error) {
    console.error('쇼핑몰 URL 불러오기 오류:', error);
    
    // 폴백: 로컬 스토리지에서 시도
    if (typeof window !== 'undefined') {
      try {
        const urls = localStorage.getItem(SHOP_URLS_KEY);
        const urlsMap = urls ? JSON.parse(urls) : {};
        return urlsMap[projectId] || null;
      } catch (e) {
        console.error('로컬 스토리지 폴백 오류:', e);
      }
    }
    
    return null;
  }
}

/**
 * 쇼핑몰 URL 저장
 */
export async function saveShopUrl(projectId: string, url: string): Promise<void> {
  try {
    // IndexedDB에 URL 저장
    await updateData(STORES.SHOP_URLS, { projectId, url });
  } catch (error) {
    console.error('쇼핑몰 URL 저장 오류:', error);
    throw error;
  }
}

/**
 * 쇼핑몰 URL 삭제
 */
export async function deleteShopUrl(projectId: string): Promise<boolean> {
  try {
    // IndexedDB에서 URL 삭제
    return await deleteData(STORES.SHOP_URLS, projectId);
  } catch (error) {
    console.error('쇼핑몰 URL 삭제 오류:', error);
    return false;
  }
}

/**
 * URL 유효성 검사
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 텍스트 자산 삭제 (간단한 구현)
 * 외부에서 사용하는 함수라 유지
 */
export function deleteTextAsset(id: string): boolean {
  try {
    // IndexedDB 함수 호출 (비동기지만 동기 인터페이스 유지를 위해 즉시 실행)
    deleteTextContent(id).catch(console.error);
    return true;
  } catch (error) {
    console.error('텍스트 삭제 오류:', error);
    return false;
  }
} 