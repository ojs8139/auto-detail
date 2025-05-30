/**
 * 이미지 섹션 매칭 API 라우트
 * 이미지를 상세페이지의 다양한 섹션에 자동으로 매칭합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  processSectionMatching,
  SectionMatchingOptions,
  PageSection
} from '@/lib/services/imageSectionMatchingService';
import { ImageAnalysisData } from '@/lib/services/imageDiversityService';

/**
 * 이미지 섹션 매칭을 수행하는 API 핸들러
 * 
 * @param req 요청 객체
 * @returns API 응답
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, options } = body;

    // 요청 검증
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '이미지 분석 데이터가 필요합니다. "images" 배열을 제공해주세요.' },
        { status: 400 }
      );
    }

    // 이미지 배열 유효성 검사
    const validImages = images.filter(img => img && typeof img.imageUrl === 'string');
    if (validImages.length === 0) {
      return NextResponse.json(
        { error: '유효한 이미지 분석 데이터가 없습니다. 각 이미지는 imageUrl 속성이 필요합니다.' },
        { status: 400 }
      );
    }

    // 섹션 매칭 옵션 파싱
    const matchingOptions: Partial<SectionMatchingOptions> = options || {};
    
    // 섹션별 이미지 수 설정이 있는 경우 PageSection 열거형으로 변환
    if (options?.sectionCounts) {
      const parsedSectionCounts: Record<PageSection, number> = {} as Record<PageSection, number>;
      
      Object.entries(options.sectionCounts).forEach(([section, count]) => {
        // 유효한 섹션인지 확인
        if (Object.values(PageSection).includes(section as PageSection) && typeof count === 'number') {
          parsedSectionCounts[section as PageSection] = count;
        }
      });
      
      matchingOptions.sectionCounts = parsedSectionCounts;
    }
    
    // 선호 이미지 크기 섹션 설정이 있는 경우 PageSection 열거형으로 변환
    if (options?.preferLargeImages && Array.isArray(options.preferLargeImages)) {
      matchingOptions.preferLargeImages = options.preferLargeImages
        .filter((section: string) => Object.values(PageSection).includes(section as PageSection))
        .map((section: string) => section as PageSection);
    }

    // 섹션 매칭 처리 실행
    const result = await processSectionMatching(validImages as ImageAnalysisData[], matchingOptions);

    return NextResponse.json(result);

  } catch (error) {
    console.error('이미지 섹션 매칭 처리 중 오류 발생:', error);
    
    return NextResponse.json(
      { error: '이미지 섹션 매칭 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 