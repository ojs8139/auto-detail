"use client";

/**
 * IndexedDB 유틸리티
 * 로컬 스토리지의 용량 제한 문제를 해결하기 위한 대용량 데이터 저장소
 */

const DB_NAME = 'detail-auto-create-db';
const DB_VERSION = 1;

// 스토어 이름 정의
export const STORES = {
  IMAGES: 'images',
  TEXTS: 'texts',
  SHOP_URLS: 'shopUrls',
  PROJECTS: 'projects',
};

/**
 * IndexedDB 초기화 함수
 * @returns Promise<IDBDatabase>
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!indexedDB) {
      reject(new Error('브라우저가 IndexedDB를 지원하지 않습니다.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error('IndexedDB 열기 실패'));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    // 처음 DB 생성 시 또는 버전 변경 시 호출
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 이미지 스토어 생성 (projectId 인덱스 추가)
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const imageStore = db.createObjectStore(STORES.IMAGES, { keyPath: 'id' });
        imageStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // 텍스트 스토어 생성 (projectId 인덱스 추가)
      if (!db.objectStoreNames.contains(STORES.TEXTS)) {
        const textStore = db.createObjectStore(STORES.TEXTS, { keyPath: 'id' });
        textStore.createIndex('projectId', 'projectId', { unique: false });
      }

      // 쇼핑몰 URL 스토어 생성 (projectId가 키)
      if (!db.objectStoreNames.contains(STORES.SHOP_URLS)) {
        db.createObjectStore(STORES.SHOP_URLS, { keyPath: 'projectId' });
      }

      // 프로젝트 스토어 생성
      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
      }
    };
  });
}

/**
 * 데이터 추가 함수
 * @param storeName 스토어 이름
 * @param data 저장할 데이터
 * @returns Promise<any>
 */
export async function addData<T>(storeName: string, data: T): Promise<T> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(data);
    
    request.onsuccess = () => {
      resolve(data);
    };
    
    request.onerror = () => {
      reject(new Error(`데이터 추가 실패: ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 데이터 업데이트 함수
 * @param storeName 스토어 이름
 * @param data 업데이트할 데이터
 * @returns Promise<any>
 */
export async function updateData<T>(storeName: string, data: T): Promise<T> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => {
      resolve(data);
    };
    
    request.onerror = () => {
      reject(new Error(`데이터 업데이트 실패: ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 데이터 가져오기 함수
 * @param storeName 스토어 이름
 * @param key 데이터 키
 * @returns Promise<any>
 */
export async function getData<T>(storeName: string, key: string): Promise<T | null> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    
    request.onerror = () => {
      reject(new Error(`데이터 가져오기 실패: ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 모든 데이터 가져오기 함수
 * @param storeName 스토어 이름
 * @returns Promise<any[]>
 */
export async function getAllData<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => {
      reject(new Error(`모든 데이터 가져오기 실패: ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 인덱스로 데이터 가져오기 함수
 * @param storeName 스토어 이름
 * @param indexName 인덱스 이름
 * @param key 검색할 키 값
 * @returns Promise<any[]>
 */
export async function getDataByIndex<T>(storeName: string, indexName: string, key: any): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(key);
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    
    request.onerror = () => {
      reject(new Error(`인덱스 데이터 가져오기 실패: ${storeName}.${indexName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * 데이터 삭제 함수
 * @param storeName 스토어 이름
 * @param key 삭제할 데이터 키
 * @returns Promise<boolean>
 */
export async function deleteData(storeName: string, key: string): Promise<boolean> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => {
      resolve(true);
    };
    
    request.onerror = () => {
      reject(new Error(`데이터 삭제 실패: ${storeName}`));
    };
    
    transaction.oncomplete = () => {
      db.close();
    };
  });
}

/**
 * IndexedDB 데이터를 로컬 스토리지에서 마이그레이션
 * @param key 로컬 스토리지 키
 * @param storeName IndexedDB 스토어 이름
 * @param transform 데이터 변환 함수 (선택적)
 */
export async function migrateFromLocalStorage<T>(
  key: string,
  storeName: string,
  transform?: (data: any) => T[]
): Promise<void> {
  try {
    // 로컬 스토리지에서 데이터 가져오기
    const data = localStorage.getItem(key);
    if (!data) return;
    
    const parsedData = JSON.parse(data);
    const itemsToStore = transform ? transform(parsedData) : parsedData;
    
    // IndexedDB에 데이터 저장
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // 배열인 경우 각 항목 저장
    if (Array.isArray(itemsToStore)) {
      for (const item of itemsToStore) {
        store.put(item);
      }
    } else {
      // 객체인 경우 직접 저장
      store.put(itemsToStore);
    }
    
    // 트랜잭션 완료 처리
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      
      transaction.onerror = () => {
        reject(new Error(`마이그레이션 실패: ${key} -> ${storeName}`));
      };
    });
  } catch (error) {
    console.error('마이그레이션 오류:', error);
  }
} 