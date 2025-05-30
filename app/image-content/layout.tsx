/**
 * 이미지 내용 분석 페이지 레이아웃
 */

import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';

interface ImageContentLayoutProps {
  children: React.ReactNode;
}

export const metadata: Metadata = {
  title: '이미지 내용 분석 | 디테일 오토 크리에이트',
  description: 'OpenAI API를 활용하여 이미지 내용을 분석하고 제품 이미지를 자동으로 선택합니다.',
};

export default function ImageContentLayout({ children }: ImageContentLayoutProps) {
  return (
    <div className="min-h-screen">
      {children}
      <Toaster />
    </div>
  );
} 