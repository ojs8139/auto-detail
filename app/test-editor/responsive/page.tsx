"use client";

import { ResponsivePreview } from "@/components/ui/responsive-preview";

export default function ResponsiveTestPage() {
  return (
    <div className="container py-8 mb-16">
      <h1 className="text-3xl font-bold mb-6">반응형 미리보기 테스트</h1>
      <p className="text-muted-foreground mb-6">
        다양한 디바이스 크기와 브레이크포인트에서 콘텐츠를 테스트할 수 있는 반응형 미리보기 페이지입니다.
      </p>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">샘플 콘텐츠로 테스트</h2>
        <div className="border rounded-lg shadow-sm p-6 bg-card">
          <ResponsivePreview>
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">반응형 테스트 페이지</h1>
              
              {/* 반응형 그리드 레이아웃 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="bg-primary/10 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">아이템 {item}</h3>
                    <p className="text-sm text-muted-foreground">이 아이템은 화면 크기에 따라 배치가 변경됩니다.</p>
                  </div>
                ))}
              </div>
              
              {/* 반응형 텍스트 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">반응형 텍스트</h2>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                  이 텍스트는 화면 크기에 따라 크기가 조정됩니다.
                </p>
              </div>
              
              {/* 반응형 flex 레이아웃 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">반응형 Flex 레이아웃</h2>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">왼쪽 영역</h3>
                    <p className="text-sm">모바일에서는 상단에 표시됩니다.</p>
                  </div>
                  <div className="flex-1 bg-muted p-4 rounded-lg">
                    <h3 className="font-medium mb-2">오른쪽 영역</h3>
                    <p className="text-sm">모바일에서는 하단에 표시됩니다.</p>
                  </div>
                </div>
              </div>
              
              {/* 반응형 가시성 */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-2">반응형 가시성</h2>
                <div className="block md:hidden p-4 bg-red-100 rounded-lg mb-2">
                  <p className="font-medium">모바일 전용 콘텐츠</p>
                </div>
                <div className="hidden md:block lg:hidden p-4 bg-yellow-100 rounded-lg mb-2">
                  <p className="font-medium">태블릿 전용 콘텐츠</p>
                </div>
                <div className="hidden lg:block xl:hidden p-4 bg-green-100 rounded-lg mb-2">
                  <p className="font-medium">데스크톱 전용 콘텐츠</p>
                </div>
                <div className="hidden xl:block p-4 bg-blue-100 rounded-lg">
                  <p className="font-medium">큰 화면 전용 콘텐츠</p>
                </div>
              </div>
              
              {/* 반응형 이미지 */}
              <div>
                <h2 className="text-xl font-bold mb-2">반응형 이미지</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <img 
                    src="https://via.placeholder.com/800x400" 
                    alt="Responsive Image" 
                    className="w-full h-auto rounded-lg"
                  />
                  <div className="flex flex-col justify-center">
                    <h3 className="font-medium mb-2">이미지 설명</h3>
                    <p className="text-sm text-muted-foreground">이 이미지는 화면 크기에 따라 레이아웃이 변경됩니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </ResponsivePreview>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">외부 URL로 테스트</h2>
        <div className="border rounded-lg shadow-sm p-6 bg-card">
          <ResponsivePreview
            iframeUrl="https://shadcn.com"
            defaultDeviceId="mobile"
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          참고: 외부 URL은 해당 사이트의 X-Frame-Options 정책에 따라 표시되지 않을 수 있습니다.
        </p>
      </div>
    </div>
  );
} 