/**
 * 스타일 분석 레이아웃
 * 스타일 분석 관련 페이지들의 공통 레이아웃입니다.
 */

import { Toaster } from "@/components/ui/toaster";

export default function StyleAnalysisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <Toaster />
    </div>
  );
} 