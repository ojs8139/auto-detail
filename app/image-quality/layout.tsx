/**
 * 이미지 품질 평가 페이지 레이아웃
 */

import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

interface ImageQualityLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: '이미지 품질 평가 | 디테일 오토 크리에이트',
  description: '이미지 품질을 분석하고 가장 적합한 이미지를 자동으로 선택합니다.',
};

export default function ImageQualityLayout({ children }: ImageQualityLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
      <Toaster />
    </div>
  );
} 