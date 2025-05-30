/**
 * 웹디자이너 가이드 생성 서비스
 * 생성된 상세페이지에 대한 웹디자이너 업무 지시 가이드를 자동으로 생성합니다.
 */

import { StyleGuide } from '@/lib/types';
import { generateText } from '@/lib/openai';
import { ImageAsset } from '@/lib/types';

// 디자이너 가이드 타입 정의
export interface DesignerGuide {
  id: string;
  projectId: string;
  createdAt: string;
  title: string;
  content: {
    designOverview: string;
    colorPalette: {
      colors: string[];
      usage: string;
    };
    typography: {
      fontFamily: string;
      headingStyle: string;
      bodyStyle: string;
      usage: string;
    };
    spacing: {
      verticalRhythm: string;
      horizontalSpacing: string;
      guidelines: string;
    };
    imageSpecs: {
      dimensions: string[];
      treatments: string[];
      bestPractices: string;
    };
    assetList: {
      images: {
        filename: string;
        usage: string;
      }[];
      icons: {
        name: string;
        usage: string;
      }[];
    };
    layoutStructure: string;
    technicalNotes: string;
  };
  exportFormats: string[];
}

/**
 * 디자이너 가이드 생성 옵션
 */
export interface DesignerGuideOptions {
  includeColorPalette?: boolean;
  includeTypography?: boolean;
  includeSpacing?: boolean;
  includeImageSpecs?: boolean;
  includeAssetList?: boolean;
  includeLayoutStructure?: boolean;
  includeTechnicalNotes?: boolean;
  customPrompt?: string;
}

/**
 * 로컬 스토리지에서 모든 디자이너 가이드 가져오기
 */
export function getAllDesignerGuides(): DesignerGuide[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const guidesJson = localStorage.getItem('designer-guides');
    return guidesJson ? JSON.parse(guidesJson) : [];
  } catch (error) {
    console.error('디자이너 가이드 로드 오류:', error);
    return [];
  }
}

/**
 * 로컬 스토리지에 모든 디자이너 가이드 저장
 */
export function saveAllDesignerGuides(guides: DesignerGuide[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('designer-guides', JSON.stringify(guides));
  } catch (error) {
    console.error('디자이너 가이드 저장 오류:', error);
  }
}

/**
 * 프로젝트 ID로 디자이너 가이드 가져오기
 */
export function getDesignerGuidesByProject(projectId: string): DesignerGuide[] {
  const guides = getAllDesignerGuides();
  return guides.filter(guide => guide.projectId === projectId);
}

/**
 * ID로 특정 디자이너 가이드 가져오기
 */
export function getDesignerGuideById(guideId: string): DesignerGuide | null {
  const guides = getAllDesignerGuides();
  return guides.find(guide => guide.id === guideId) || null;
}

/**
 * 디자이너 가이드 저장
 */
export function saveDesignerGuide(guide: DesignerGuide): DesignerGuide {
  const guides = getAllDesignerGuides();
  const existingIndex = guides.findIndex(g => g.id === guide.id);
  
  if (existingIndex >= 0) {
    guides[existingIndex] = guide;
  } else {
    guides.push(guide);
  }
  
  saveAllDesignerGuides(guides);
  return guide;
}

/**
 * 디자이너 가이드 삭제
 */
export function deleteDesignerGuide(guideId: string): boolean {
  const guides = getAllDesignerGuides();
  const filteredGuides = guides.filter(guide => guide.id !== guideId);
  
  if (filteredGuides.length < guides.length) {
    saveAllDesignerGuides(filteredGuides);
    return true;
  }
  
  return false;
}

/**
 * 고유 ID 생성
 */
function generateId(): string {
  return `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * HTML 콘텐츠에서 색상 코드 추출
 */
function extractColorsFromHtml(htmlContent: string): string[] {
  const colorRegex = /#([0-9A-F]{3}){1,2}\b|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*\)/gi;
  const matches = htmlContent.match(colorRegex) || [];
  return Array.from(new Set(matches)); // 중복 제거
}

/**
 * HTML 콘텐츠에서 폰트 패밀리 추출
 */
function extractFontsFromHtml(htmlContent: string): string[] {
  const fontRegex = /font-family:\s*['"]?([^'",;]+)['"]?/g;
  const matches: string[] = [];
  let match;
  
  while ((match = fontRegex.exec(htmlContent)) !== null) {
    if (match[1]) {
      matches.push(match[1].trim());
    }
  }
  
  return Array.from(new Set(matches)); // 중복 제거
}

/**
 * 스타일 가이드와 HTML 콘텐츠를 기반으로 디자이너 가이드 생성
 */
export async function generateDesignerGuide(
  projectId: string,
  title: string,
  htmlContent: string,
  styleGuide?: StyleGuide,
  images?: ImageAsset[],
  options: DesignerGuideOptions = {}
): Promise<DesignerGuide> {
  // 기본 옵션 설정
  const defaultOptions: DesignerGuideOptions = {
    includeColorPalette: true,
    includeTypography: true,
    includeSpacing: true,
    includeImageSpecs: true,
    includeAssetList: true,
    includeLayoutStructure: true,
    includeTechnicalNotes: true,
  };
  
  const fullOptions = { ...defaultOptions, ...options };
  
  // HTML에서 색상 및 폰트 추출
  const extractedColors = extractColorsFromHtml(htmlContent);
  const extractedFonts = extractFontsFromHtml(htmlContent);
  
  // 이미지 파일명 추출
  const imageFilenames = images?.map(img => ({
    filename: img.filename || '이름 없는 이미지',
    path: img.url || img.path || '',
  })) || [];

  // 스타일 가이드 정보 활용
  const styleInfo = styleGuide 
    ? `스타일 가이드 정보:
       - 메인 색상: ${styleGuide.mainColor || 'N/A'}
       - 강조 색상: ${styleGuide.accentColor || 'N/A'}
       - 폰트: ${styleGuide.font || 'N/A'}
       - 레이아웃 스타일: ${styleGuide.layoutStyle || 'N/A'}`
    : '스타일 가이드 정보가 없습니다.';
  
  // 이미지 정보 분석
  const imageDetails = images && images.length > 0
    ? `이미지 정보:
      - 총 ${images.length}개의 이미지가 사용됨
      - 파일 형식: ${Array.from(new Set(images.map(img => img.filename?.split('.').pop() || 'jpg'))).join(', ')}
      - 이미지 내용: 제품 상세 사진, 사용 예시, 디테일 컷 등`
    : '이미지 정보가 없습니다.';
  
  // AI로 디자인 가이드 생성
  const designerGuidePrompt = `
당신은 10년 이상의 경력을 가진, 쇼핑몰 상세 페이지 제작 전문 웹디자이너입니다. 지금 중요한 프로젝트를 위한 디자인 가이드 문서를 작성해야 합니다.

# 프로젝트 정보
- 프로젝트 제목: ${title}
- 용도: 쇼핑몰 상세 페이지
${styleInfo}
${imageDetails}

# 과제
실제 웹디자이너가 바로 작업할 수 있는 상세하고 실용적인 디자인 가이드를 JSON 형식으로 작성해주세요.

## 반드시 포함되어야 할 내용:

1. **designOverview**: 
   - 디자인 컨셉의 명확한 방향성(예: 미니멀, 고급스러움, 활동적 등)
   - 상세 페이지의 목표와 주요 디자인 원칙(3-5가지)
   - 디자인 레퍼런스나 벤치마크할 만한 사이트 2-3개 제안

2. **colorPalette**:
   - 정확한 HEX 색상 코드(최소 5개 이상)를 포함한 메인, 보조, 강조 색상
   - 각 색상의 용도(배경, 텍스트, 버튼, 강조 요소 등)
   - 컬러 팔레트의 일관성 있는 사용을 위한 지침
   - 색상: ${extractedColors.join(', ')}

3. **typography**:
   - 구체적인 폰트 이름, 굵기, 크기(px 단위)
   - 제목(h1-h3), 소제목, 본문, 버튼, 캡션 등의 텍스트 스타일 명세
   - 텍스트 색상과 행간, 자간에 대한 세부 지침
   - 폰트: ${extractedFonts.join(', ')}

4. **spacing**:
   - 픽셀 단위의 정확한 여백 체계(8px, 16px, 24px 등)
   - 섹션 간, 요소 간 일관된 여백 규칙
   - 반응형 디자인을 위한 여백 조정 지침

5. **imageSpecs**:
   - 이미지 최적 해상도와 비율(px 단위로 정확히)
   - 파일 형식과 최적화 지침(용량, 압축률)
   - 이미지 처리 스타일(그림자, 테두리, 오버레이 등)
   - 이미지 배치와 정렬 방식

6. **assetList**:
   - 사용된 모든 이미지 파일의 목록과 각각의 용도
   - 필요한 아이콘 목록과 용도
   - 각 이미지/아이콘에 대한 디자인 처리 방법

7. **layoutStructure**:
   - 상세 페이지의 전체 구조와 섹션 배치
   - 그리드 시스템 정의(컬럼 수, 거터 폭)
   - 반응형 브레이크포인트와 각 지점에서의 레이아웃 변화
   - 모바일 최적화를 위한 특별 지침

8. **technicalNotes**:
   - CSS 구현 시 주의점
   - 애니메이션이나 인터랙션 요소
   - 접근성 고려사항
   - SEO 최적화를 위한 마크업 요소

# 중요 가이드라인:
- 추상적이거나 모호한 표현을 피하고, 구체적인 수치와 명확한 지침을 제공하세요.
- "적절한", "적당한" 같은 모호한 표현 대신 정확한 수치(px, em, %)를 사용하세요.
- 디자이너가 바로 작업할 수 있도록 실행 가능한 지침을 제공하세요.
- 가이드의 각 섹션은 빈 항목 없이 완전하게 작성하세요.

${options.customPrompt ? `추가 지침: ${options.customPrompt}` : ''}

최종 결과는 JSON 형식으로 반환해주세요. 모든 필드에 실질적인 값을 채워주세요.
`;

  try {
    // AI 응답 생성
    const response = await generateText(designerGuidePrompt);
    
    // JSON 형식의 응답 파싱
    let guideContent;
    try {
      // JSON 응답 추출 시도
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '').trim() : response;
      guideContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      
      // 파싱 실패 시 기본 구조 생성
      guideContent = {
        designOverview: response.substring(0, 500),
        colorPalette: {
          colors: extractedColors.length > 0 ? extractedColors : ['#000000', '#ffffff'],
          usage: '추출된 색상 사용 지침'
        },
        typography: {
          fontFamily: extractedFonts.length > 0 ? extractedFonts.join(', ') : 'system-ui, sans-serif',
          headingStyle: '제목 스타일',
          bodyStyle: '본문 스타일',
          usage: '텍스트 사용 지침'
        },
        spacing: {
          verticalRhythm: '8px, 16px, 24px 기반 수직 간격 체계',
          horizontalSpacing: '요소 간 수평 간격',
          guidelines: '간격 활용 가이드라인'
        },
        imageSpecs: {
          dimensions: ['800x600px (데스크톱)', '400x300px (모바일)'],
          treatments: ['그림자', '둥근 모서리', '오버레이'],
          bestPractices: '이미지 최적화 지침'
        },
        assetList: {
          images: imageFilenames.map((img, index) => ({
            filename: img.filename,
            usage: `이미지 ${index + 1} 사용 용도`
          })),
          icons: []
        },
        layoutStructure: '레이아웃 구조 설명',
        technicalNotes: '기술적 구현 참고사항'
      };
    }
    
    // 디자이너 가이드 객체 생성
    const designerGuide: DesignerGuide = {
      id: generateId(),
      projectId,
      createdAt: new Date().toISOString(),
      title: `${title} 디자인 가이드`,
      content: guideContent,
      exportFormats: ['markdown', 'html', 'pdf']
    };
    
    // 디자이너 가이드 저장
    return saveDesignerGuide(designerGuide);
  } catch (error) {
    console.error('디자이너 가이드 생성 오류:', error);
    throw new Error('디자이너 가이드 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 디자이너 가이드를 Markdown 형식으로 변환
 */
export function convertGuideToMarkdown(guide: DesignerGuide): string {
  const { content } = guide;
  
  return `# ${guide.title}
생성일: ${new Date(guide.createdAt).toLocaleDateString()}

## 디자인 개요
${content.designOverview}

## 색상 팔레트
${content.colorPalette.colors.map(color => `- ${color}`).join('\n')}

### 색상 사용 지침
${content.colorPalette.usage}

## 타이포그래피
- 폰트 패밀리: ${content.typography.fontFamily}
- 제목 스타일: ${content.typography.headingStyle}
- 본문 스타일: ${content.typography.bodyStyle}

### 타이포그래피 사용 지침
${content.typography.usage}

## 여백 및 간격
- 수직 리듬: ${content.spacing.verticalRhythm}
- 수평 간격: ${content.spacing.horizontalSpacing}

### 간격 가이드라인
${content.spacing.guidelines}

## 이미지 사양
- 권장 크기: ${content.imageSpecs.dimensions.join(', ')}
- 이미지 처리: ${content.imageSpecs.treatments.join(', ')}

### 이미지 사용 지침
${content.imageSpecs.bestPractices}

## 에셋 목록
### 이미지
${content.assetList.images.map(img => `- ${img.filename}: ${img.usage}`).join('\n')}

### 아이콘
${content.assetList.icons.map(icon => `- ${icon.name}: ${icon.usage}`).join('\n')}

## 레이아웃 구조
${content.layoutStructure}

## 기술 참고사항
${content.technicalNotes}
`;
}

/**
 * 디자이너 가이드를 HTML 형식으로 변환
 */
export function convertGuideToHtml(guide: DesignerGuide): string {
  const { content } = guide;
  
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${guide.title}</title>
  <style>
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3 { color: #111; }
    h1 { border-bottom: 2px solid #f0f0f0; padding-bottom: 0.5rem; }
    h2 { margin-top: 2rem; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.3rem; }
    .color-swatch {
      display: inline-block;
      width: 20px;
      height: 20px;
      margin-right: 8px;
      border: 1px solid #ddd;
      vertical-align: middle;
    }
    .section { margin-bottom: 2rem; }
    .subsection { margin-left: 1rem; margin-bottom: 1rem; }
    code {
      background-color: #f5f5f5;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: monospace;
    }
    .meta { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>${guide.title}</h1>
  <p class="meta">생성일: ${new Date(guide.createdAt).toLocaleDateString()}</p>
  
  <div class="section">
    <h2>디자인 개요</h2>
    <p>${content.designOverview}</p>
  </div>
  
  <div class="section">
    <h2>색상 팔레트</h2>
    <ul>
      ${content.colorPalette.colors.map(color => `
        <li><span class="color-swatch" style="background-color: ${color}"></span> ${color}</li>
      `).join('')}
    </ul>
    <div class="subsection">
      <h3>색상 사용 지침</h3>
      <p>${content.colorPalette.usage}</p>
    </div>
  </div>
  
  <div class="section">
    <h2>타이포그래피</h2>
    <ul>
      <li><strong>폰트 패밀리:</strong> ${content.typography.fontFamily}</li>
      <li><strong>제목 스타일:</strong> ${content.typography.headingStyle}</li>
      <li><strong>본문 스타일:</strong> ${content.typography.bodyStyle}</li>
    </ul>
    <div class="subsection">
      <h3>타이포그래피 사용 지침</h3>
      <p>${content.typography.usage}</p>
    </div>
  </div>
  
  <div class="section">
    <h2>여백 및 간격</h2>
    <ul>
      <li><strong>수직 리듬:</strong> ${content.spacing.verticalRhythm}</li>
      <li><strong>수평 간격:</strong> ${content.spacing.horizontalSpacing}</li>
    </ul>
    <div class="subsection">
      <h3>간격 가이드라인</h3>
      <p>${content.spacing.guidelines}</p>
    </div>
  </div>
  
  <div class="section">
    <h2>이미지 사양</h2>
    <ul>
      <li><strong>권장 크기:</strong> ${content.imageSpecs.dimensions.join(', ')}</li>
      <li><strong>이미지 처리:</strong> ${content.imageSpecs.treatments.join(', ')}</li>
    </ul>
    <div class="subsection">
      <h3>이미지 사용 지침</h3>
      <p>${content.imageSpecs.bestPractices}</p>
    </div>
  </div>
  
  <div class="section">
    <h2>에셋 목록</h2>
    <div class="subsection">
      <h3>이미지</h3>
      <ul>
        ${content.assetList.images.map(img => `
          <li><strong>${img.filename}:</strong> ${img.usage}</li>
        `).join('')}
      </ul>
    </div>
    <div class="subsection">
      <h3>아이콘</h3>
      <ul>
        ${content.assetList.icons.map(icon => `
          <li><strong>${icon.name}:</strong> ${icon.usage}</li>
        `).join('')}
      </ul>
    </div>
  </div>
  
  <div class="section">
    <h2>레이아웃 구조</h2>
    <p>${content.layoutStructure}</p>
  </div>
  
  <div class="section">
    <h2>기술 참고사항</h2>
    <p>${content.technicalNotes}</p>
  </div>
</body>
</html>`;
}

/**
 * HTML 컨텐츠를 Blob URL로 변환
 */
export function htmlToUrl(html: string): string {
  const blob = new Blob([html], { type: 'text/html' });
  return URL.createObjectURL(blob);
}

/**
 * 마크다운 컨텐츠를 Blob URL로 변환
 */
export function markdownToUrl(markdown: string): string {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  return URL.createObjectURL(blob);
} 