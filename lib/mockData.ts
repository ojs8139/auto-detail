"use client";

import { Project, ImageAsset, TextContent } from './types';
import { saveContent, setStorage, generateId } from './storage';

// 로컬 스토리지 키 정의
const STORAGE_KEY = 'detail-auto-create-projects';
const IMAGE_ASSETS_KEY = 'detail-auto-create-images';
const TEXT_CONTENTS_KEY = 'detail-auto-create-texts';
const SHOP_URLS_KEY = 'detail-auto-create-urls';
const GENERATED_CONTENTS_KEY = 'detail-auto-create-contents';

// 샘플 프로젝트 ID
export const SAMPLE_PROJECT_ID = 'sample-project-123';

// 샘플 이미지 URL (무료 상용 이미지 사용)
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
  'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=764&q=80',
  'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1025&q=80',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80'
];

// 샘플 프로젝트 데이터
const sampleProject: Project = {
  id: SAMPLE_PROJECT_ID,
  name: '울트라 부스트 X 운동화',
  description: '최신 기술이 적용된 프리미엄 러닝화',
  createdAt: '2023-05-15T09:00:00Z',
  updatedAt: '2023-05-15T09:00:00Z',
  status: true,
};

// 샘플 이미지 자산
const sampleImages: ImageAsset[] = SAMPLE_IMAGES.map((url, index) => ({
  id: `sample-image-${index + 1}`,
  projectId: SAMPLE_PROJECT_ID,
  url: url,
  path: url,
  type: 'product',
  metadata: {
    width: 1200,
    height: 800,
    format: 'image/jpeg',
    size: 123456,
  },
}));

// 샘플 텍스트 콘텐츠
const sampleTexts: TextContent[] = [
  {
    id: 'sample-text-1',
    projectId: SAMPLE_PROJECT_ID,
    content: '울트라 부스트 X 운동화',
    type: 'heading',
  },
  {
    id: 'sample-text-2',
    projectId: SAMPLE_PROJECT_ID,
    content: '울트라 부스트 X는 혁신적인 쿠셔닝 기술과 반응성 있는 미드솔, 그리고 편안한 착화감을 제공하는 프리미엄 러닝화입니다. 최첨단 기술력으로 제작된 이 운동화는 장거리 러닝부터 일상 착용까지 다양한 용도로 활용할 수 있습니다. 특수 개발된 바운스백 기술은 에너지 반환율을 높여 러닝 효율성을 극대화하며, 통기성 있는 메쉬 소재의 갑피는 장시간 착용에도 쾌적함을 유지합니다. 지속 가능한 재활용 소재를 사용하여 환경 보호에도 기여하는 제품입니다.',
    type: 'body',
  },
  {
    id: 'sample-text-3',
    projectId: SAMPLE_PROJECT_ID,
    content: '• 혁신적인 쿠셔닝 시스템\n• 통기성 메쉬 갑피\n• 내구성 높은 러버 아웃솔\n• 반응성 있는 미드솔\n• 재활용 소재 30% 함유',
    type: 'bullet',
  },
  {
    id: 'sample-text-4',
    projectId: SAMPLE_PROJECT_ID,
    content: '최대 25% 할인 중! 특별 프로모션 코드: ULTRABOOST2023',
    type: 'callout',
  },
];

// 샘플 쇼핑몰 URL
const sampleShopUrl = 'https://example.com/shop/ultraboost-x';

// 샘플 생성된 컨텐츠
const sampleGeneratedContent = `<h1>울트라 부스트 X - 러닝의 혁명을 경험하세요</h1>

<div class="product-image-main">
  <img src="${SAMPLE_IMAGES[0]}" alt="울트라 부스트 X 운동화 대표 이미지" class="main-image" />
</div>

<h2>최고의 쿠셔닝, 최상의 착화감</h2>
<p>울트라 부스트 X는 혁신적인 쿠셔닝 기술과 반응성 있는 미드솔, 그리고 편안한 착화감을 제공하는 프리미엄 러닝화입니다. 발을 감싸는 듯한 피팅감과 함께 매 스텝마다 에너지를 돌려주는 바운스백 효과를 경험해보세요.</p>

<div class="product-gallery">
  <img src="${SAMPLE_IMAGES[1]}" alt="울트라 부스트 X 운동화 측면 이미지" class="gallery-image" />
  <img src="${SAMPLE_IMAGES[2]}" alt="울트라 부스트 X 운동화 바닥 이미지" class="gallery-image" />
  <img src="${SAMPLE_IMAGES[3]}" alt="울트라 부스트 X 운동화 착용 이미지" class="gallery-image" />
</div>

<h2>첨단 기술의 집약체</h2>
<p>특수 개발된 프라임니트 갑피는 발의 움직임에 따라 자연스럽게 늘어나고 지지해주어 완벽한 핏을 제공합니다. 또한 통기성이 뛰어나 장시간 착용해도 쾌적함을 유지할 수 있습니다.</p>

<ul>
  <li>혁신적인 쿠셔닝 시스템으로 충격 흡수</li>
  <li>통기성 메쉬 갑피로 쾌적한 착용감</li>
  <li>내구성 높은 러버 아웃솔로 오래 사용 가능</li>
  <li>반응성 있는 미드솔로 에너지 효율 향상</li>
  <li>재활용 소재 30% 함유로 환경 보호에 기여</li>
</ul>

<h2>다양한 활용성</h2>
<p>울트라 부스트 X는 장거리 러닝부터 일상 착용까지 다양한 용도로 활용할 수 있습니다. 가벼운 조깅, 마라톤 훈련, 피트니스 활동, 그리고 캐주얼한 외출까지 모든 상황에서 편안함과 스타일을 동시에 제공합니다.</p>

<h2>지속 가능한 미래를 위한 선택</h2>
<p>환경을 생각하는 소비자들을 위해 울트라 부스트 X는 해양에서 수거한 플라스틱을 재활용한 원사를 사용하여 제작되었습니다. 당신의 선택이 더 나은 지구를 만드는 데 기여합니다.</p>

<p><strong>지금 구매하시면 최대 25% 할인! 특별 프로모션 코드: ULTRABOOST2023</strong></p>`;

// 목업 데이터 로드 함수
export function loadMockData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // 프로젝트 데이터 저장
    const existingProjects = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!existingProjects.some((p: Project) => p.id === SAMPLE_PROJECT_ID)) {
      existingProjects.push(sampleProject);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingProjects));
    }
    
    // 이미지 자산 저장
    const existingImages = JSON.parse(localStorage.getItem(IMAGE_ASSETS_KEY) || '[]');
    const newImages = [...existingImages];
    
    for (const img of sampleImages) {
      if (!newImages.some((i: ImageAsset) => i.id === img.id)) {
        newImages.push(img);
      }
    }
    
    localStorage.setItem(IMAGE_ASSETS_KEY, JSON.stringify(newImages));
    
    // 텍스트 콘텐츠 저장
    const existingTexts = JSON.parse(localStorage.getItem(TEXT_CONTENTS_KEY) || '[]');
    const newTexts = [...existingTexts];
    
    for (const text of sampleTexts) {
      if (!newTexts.some((t: TextContent) => t.id === text.id)) {
        newTexts.push(text);
      }
    }
    
    localStorage.setItem(TEXT_CONTENTS_KEY, JSON.stringify(newTexts));
    
    // 쇼핑몰 URL 저장
    const existingUrls = JSON.parse(localStorage.getItem(SHOP_URLS_KEY) || '{}');
    existingUrls[SAMPLE_PROJECT_ID] = sampleShopUrl;
    localStorage.setItem(SHOP_URLS_KEY, JSON.stringify(existingUrls));
    
    // 생성된 컨텐츠 저장
    const existingContents = JSON.parse(localStorage.getItem(GENERATED_CONTENTS_KEY) || '[]');
    
    if (!existingContents.some((c: any) => c.projectId === SAMPLE_PROJECT_ID)) {
      const now = new Date().toISOString();
      
      const newContent = {
        id: generateId(),
        projectId: SAMPLE_PROJECT_ID,
        content: sampleGeneratedContent,
        createdAt: now,
        name: '울트라 부스트 X 상세 페이지'
      };
      
      existingContents.push(newContent);
      localStorage.setItem(GENERATED_CONTENTS_KEY, JSON.stringify(existingContents));
    }
    
    console.log('🎉 목업 데이터가 성공적으로 로드되었습니다!');
  } catch (error) {
    console.error('목업 데이터 로드 중 오류 발생:', error);
  }
}

// 목업 데이터 초기화 함수 (기존 데이터 삭제 후 샘플 데이터 새로 로드)
export function resetMockData(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // 기존 데이터 삭제
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(IMAGE_ASSETS_KEY);
    localStorage.removeItem(TEXT_CONTENTS_KEY);
    localStorage.removeItem(SHOP_URLS_KEY);
    localStorage.removeItem(GENERATED_CONTENTS_KEY);
    
    // 샘플 데이터 로드
    loadMockData();
    
    console.log('🔄 목업 데이터가 성공적으로 초기화되었습니다!');
  } catch (error) {
    console.error('목업 데이터 초기화 중 오류 발생:', error);
  }
} 