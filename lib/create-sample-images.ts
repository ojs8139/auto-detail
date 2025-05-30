"use client";

import { useEffect } from 'react';
import { saveAs } from 'file-saver';

/**
 * 샘플 이미지 URL을 생성하는 유틸리티 함수
 */
export function generateSampleImageURL(
  width: number = 300, 
  height: number = 200, 
  bgColor: string = '#3b82f6', 
  textColor: string = '#ffffff',
  text: string = 'Sample Image'
): string {
  // 서버 사이드 렌더링 환경인 경우 빈 문자열 반환
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return '';
  }
  
  // 캔버스 생성
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 배경 색상 설정
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // 텍스트 스타일 설정
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.max(16, Math.floor(width / 15))}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 텍스트 그리기
  ctx.fillText(text, width / 2, height / 2);
  
  // 데이터 URL 반환
  return canvas.toDataURL('image/jpeg');
}

/**
 * 샘플 이미지를 생성하고 저장하는 React 훅
 */
export function useSampleImages() {
  useEffect(() => {
    const createSampleImages = async () => {
      try {
        // 샘플 이미지 생성 및 저장
        const samples = [
          { text: 'Sample 1', color: '#3b82f6' }, // 파란색
          { text: 'Sample 2', color: '#10b981' }, // 초록색
          { text: 'Sample 3', color: '#ef4444' }, // 빨간색
          { text: 'Sample 4', color: '#f59e0b' }, // 주황색
        ];
        
        for (let i = 0; i < samples.length; i++) {
          const { text, color } = samples[i];
          const dataUrl = generateSampleImageURL(300, 200, color, '#ffffff', text);
          
          // DataURL을 Blob으로 변환
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          // 파일로 저장
          saveAs(blob, `/placeholders/sample-${i + 1}.jpg`);
        }
        
        console.log('샘플 이미지가 생성되었습니다.');
      } catch (error) {
        console.error('샘플 이미지 생성 오류:', error);
      }
    };
    
    // 필요한 경우에만 실행
    if (window.location.pathname.includes('/test-editor/image-replace')) {
      createSampleImages();
    }
  }, []);
}

/**
 * 인라인 샘플 이미지 URL을 제공하는 함수
 * 서버 사이드 렌더링이나 이미지 서버 접근이 어려울 때 사용
 */
export function getInlineSampleImageURLs(): string[] {
  // 서버 사이드 렌더링 환경인 경우 빈 배열 반환
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return ['', '', '', ''];
  }
  
  return [
    generateSampleImageURL(300, 200, '#3b82f6', '#ffffff', 'Sample 1'),
    generateSampleImageURL(300, 200, '#10b981', '#ffffff', 'Sample 2'),
    generateSampleImageURL(300, 200, '#ef4444', '#ffffff', 'Sample 3'),
    generateSampleImageURL(300, 200, '#f59e0b', '#ffffff', 'Sample 4'),
  ];
} 