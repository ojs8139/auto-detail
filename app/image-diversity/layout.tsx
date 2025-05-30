/**
 * 이미지 다양성 분석 페이지 레이아웃
 */

import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

interface ImageDiversityLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: '이미지 다양성 분석 | 디테일 오토 크리에이트',
  description: '이미지 다양성을 분석하고 중복을 제거하여 최적의 이미지 세트를 추천합니다.',
};

export default function ImageDiversityLayout({ children }: ImageDiversityLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
      <Toaster />
    </div>
  );
} 