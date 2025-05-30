"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Clipboard, ChevronDown, ChevronUp } from 'lucide-react';
import type { DesignerGuide } from '@/lib/services/designerGuideService';
import { 
  convertGuideToMarkdown, 
  convertGuideToHtml, 
  markdownToUrl, 
  htmlToUrl 
} from '@/lib/services/designerGuideService';

interface DesignerGuideProps {
  guide: DesignerGuide;
  className?: string;
}

export function DesignerGuide({ guide, className = '' }: DesignerGuideProps) {
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    colors: true,
    typography: true,
    spacing: false,
    images: false,
    assets: false,
    layout: false,
    technical: false,
  });

  // 섹션 확장/축소 토글
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 마크다운 다운로드
  const handleDownloadMarkdown = () => {
    const markdown = convertGuideToMarkdown(guide);
    const url = markdownToUrl(markdown);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // HTML 다운로드
  const handleDownloadHtml = () => {
    const html = convertGuideToHtml(guide);
    const url = htmlToUrl(html);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${guide.title.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // PDF 다운로드
  const handleDownloadPdf = async () => {
    try {
      // PDF 생성을 위한 jsPDF 동적 로드
      const { jsPDF } = await import('jspdf');
      const html = convertGuideToHtml(guide);
      
      // HTML을 PDF로 변환하기 위한 html2canvas 동적 로드
      const { default: html2canvas } = await import('html2canvas');
      
      // HTML을 임시 요소로 삽입
      const tempEl = document.createElement('div');
      tempEl.innerHTML = html;
      tempEl.style.position = 'absolute';
      tempEl.style.left = '-9999px';
      tempEl.style.width = '794px'; // A4 width in pixels at 96 DPI
      document.body.appendChild(tempEl);
      
      try {
        // HTML을 캔버스로 변환
        const canvas = await html2canvas(tempEl, {
          scale: 1,
          useCORS: true,
          logging: false
        });
        
        // PDF 생성
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        // 캔버스를 이미지로 변환하여 PDF에 추가
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 10, 10, 190, 0, undefined, 'FAST');
        
        // PDF 다운로드
        pdf.save(`${guide.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      } finally {
        // 임시 요소 제거
        document.body.removeChild(tempEl);
      }
    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      alert('PDF 내보내기 기능을 사용하려면 jspdf와 html2canvas 패키지를 설치해야 합니다.');
    }
  };

  // 클립보드에 복사
  const handleCopyToClipboard = () => {
    const markdown = convertGuideToMarkdown(guide);
    navigator.clipboard.writeText(markdown)
      .then(() => alert('클립보드에 복사되었습니다.'))
      .catch(err => console.error('클립보드 복사 오류:', err));
  };

  // 섹션 헤더 컴포넌트
  const SectionHeader = ({ title, section }: { title: string, section: string }) => (
    <div 
      className="flex justify-between items-center py-2 cursor-pointer border-b"
      onClick={() => toggleSection(section)}
    >
      <h3 className="text-lg font-medium">{title}</h3>
      {expandedSections[section] ? 
        <ChevronUp className="w-4 h-4" /> : 
        <ChevronDown className="w-4 h-4" />
      }
    </div>
  );

  // 색상 스와치 컴포넌트
  const ColorSwatch = ({ color }: { color: string }) => (
    <div className="flex items-center my-1">
      <div 
        className="w-5 h-5 rounded-full mr-2 border border-gray-200" 
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-mono">{color}</span>
    </div>
  );

  // 값이 비어있는지 확인하는 함수
  const isEmpty = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  };

  // 값이 비어있을 때 기본값을 반환하는 함수
  const getValueOrDefault = (value: any, defaultValue: string = '정보가 제공되지 않았습니다.'): any => {
    return isEmpty(value) ? defaultValue : value;
  };

  // 폰트 스타일 미리보기
  const FontPreview = ({ fontFamily, style, text }: { fontFamily: string, style: string, text: string }) => {
    // 스타일 문자열에서 폰트 크기, 두께 등 추출
    const sizeMatch = style.match(/(\d+)px/);
    const weightMatch = style.match(/(bold|normal|light|\d+)/i);
    
    const fontSize = sizeMatch ? sizeMatch[1] + 'px' : 'inherit';
    const fontWeight = weightMatch ? weightMatch[1] : 'normal';
    
    return (
      <div 
        className="border p-2 my-1 rounded" 
        style={{ 
          fontFamily, 
          fontSize, 
          fontWeight,
          lineHeight: style.includes('line-height') ? style.match(/line-height:\s*([^;]+)/i)?.[1] : 'normal'
        }}
      >
        {text}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle>{guide.title}</CardTitle>
          <div className="text-sm text-muted-foreground">
            생성일: {new Date(guide.createdAt).toLocaleDateString()}
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="preview">미리보기</TabsTrigger>
              <TabsTrigger value="markdown">마크다운</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="space-y-4">
              {/* 디자인 개요 섹션 */}
              <div>
                <SectionHeader title="디자인 개요" section="overview" />
                {expandedSections.overview && (
                  <div className="py-2">
                    <p className="whitespace-pre-line">{getValueOrDefault(guide.content.designOverview)}</p>
                  </div>
                )}
              </div>
              
              {/* 색상 팔레트 섹션 */}
              <div>
                <SectionHeader title="색상 팔레트" section="colors" />
                {expandedSections.colors && (
                  <div className="py-2">
                    {guide.content.colorPalette.colors && guide.content.colorPalette.colors.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                          {guide.content.colorPalette.colors.map((color, idx) => (
                            <ColorSwatch key={idx} color={color} />
                          ))}
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium mb-1">색상 사용 지침</h4>
                          <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.colorPalette.usage)}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">색상 정보가 없습니다.</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* 타이포그래피 섹션 */}
              <div>
                <SectionHeader title="타이포그래피" section="typography" />
                {expandedSections.typography && (
                  <div className="py-2">
                    <div className="space-y-2 mb-3">
                      <div>
                        <h4 className="text-sm font-medium">폰트 패밀리</h4>
                        <p className="text-sm font-mono">{getValueOrDefault(guide.content.typography.fontFamily)}</p>
                        
                        {!isEmpty(guide.content.typography.fontFamily) && (
                          <div className="mt-2">
                            <FontPreview 
                              fontFamily={guide.content.typography.fontFamily.split(',')[0]} 
                              style="normal" 
                              text="이 텍스트는 지정된 폰트 패밀리로 렌더링됩니다." 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium">제목 스타일</h4>
                        <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.typography.headingStyle)}</p>
                        
                        {!isEmpty(guide.content.typography.headingStyle) && !isEmpty(guide.content.typography.fontFamily) && (
                          <div className="mt-2">
                            <FontPreview 
                              fontFamily={guide.content.typography.fontFamily.split(',')[0]} 
                              style={guide.content.typography.headingStyle} 
                              text="제목 스타일 미리보기" 
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="text-sm font-medium">본문 스타일</h4>
                        <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.typography.bodyStyle)}</p>
                        
                        {!isEmpty(guide.content.typography.bodyStyle) && !isEmpty(guide.content.typography.fontFamily) && (
                          <div className="mt-2">
                            <FontPreview 
                              fontFamily={guide.content.typography.fontFamily.split(',')[0]} 
                              style={guide.content.typography.bodyStyle} 
                              text="본문 텍스트 스타일 미리보기입니다. 본문 텍스트는 가독성이 좋아야 하며, 적절한 행간과 자간을 가져야 합니다." 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-1">타이포그래피 사용 지침</h4>
                      <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.typography.usage)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 여백 및 간격 섹션 */}
              <div>
                <SectionHeader title="여백 및 간격" section="spacing" />
                {expandedSections.spacing && (
                  <div className="py-2">
                    <div className="space-y-2 mb-3">
                      <div>
                        <h4 className="text-sm font-medium">수직 리듬</h4>
                        <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.spacing.verticalRhythm)}</p>
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium">수평 간격</h4>
                        <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.spacing.horizontalSpacing)}</p>
                      </div>
                      
                      {!isEmpty(guide.content.spacing.verticalRhythm) && (
                        <div className="mt-4 border rounded-md p-3">
                          <div className="text-center text-xs text-muted-foreground mb-2">간격 시각화</div>
                          <div className="flex flex-col items-center space-y-2">
                            <div className="w-full h-4 bg-primary/10 rounded"></div>
                            <div className="w-full h-8 bg-primary/20 rounded"></div>
                            <div className="w-full h-12 bg-primary/30 rounded"></div>
                            <div className="w-full h-16 bg-primary/40 rounded"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-1">간격 가이드라인</h4>
                      <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.spacing.guidelines)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 이미지 사양 섹션 */}
              <div>
                <SectionHeader title="이미지 사양" section="images" />
                {expandedSections.images && (
                  <div className="py-2">
                    <div className="space-y-2 mb-3">
                      <div>
                        <h4 className="text-sm font-medium">권장 이미지 크기</h4>
                        {!isEmpty(guide.content.imageSpecs.dimensions) ? (
                          <ul className="list-disc list-inside text-sm pl-2">
                            {guide.content.imageSpecs.dimensions.map((dimension, idx) => (
                              <li key={idx}>{dimension}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">이미지 크기 정보가 없습니다.</p>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <h4 className="text-sm font-medium">이미지 처리 방식</h4>
                        {!isEmpty(guide.content.imageSpecs.treatments) ? (
                          <ul className="list-disc list-inside text-sm pl-2">
                            {guide.content.imageSpecs.treatments.map((treatment, idx) => (
                              <li key={idx}>{treatment}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">이미지 처리 방식 정보가 없습니다.</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <h4 className="text-sm font-medium mb-1">이미지 최적화 지침</h4>
                      <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.imageSpecs.bestPractices)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 자산 목록 섹션 */}
              <div>
                <SectionHeader title="자산 목록" section="assets" />
                {expandedSections.assets && (
                  <div className="py-2">
                    {/* 이미지 목록 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">이미지 파일</h4>
                      {!isEmpty(guide.content.assetList.images) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {guide.content.assetList.images.map((img, idx) => (
                            <div key={idx} className="border rounded-md p-2 text-sm">
                              <div className="font-medium truncate">{img.filename}</div>
                              <div className="text-muted-foreground mt-1">{getValueOrDefault(img.usage, '용도가 지정되지 않았습니다.')}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">등록된 이미지가 없습니다.</p>
                      )}
                    </div>
                    
                    {/* 아이콘 목록 */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">아이콘</h4>
                      {!isEmpty(guide.content.assetList.icons) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {guide.content.assetList.icons.map((icon, idx) => (
                            <div key={idx} className="border rounded-md p-2 text-sm">
                              <div className="font-medium">{icon.name}</div>
                              <div className="text-muted-foreground mt-1">{getValueOrDefault(icon.usage, '용도가 지정되지 않았습니다.')}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">등록된 아이콘이 없습니다.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 레이아웃 구조 섹션 */}
              <div>
                <SectionHeader title="레이아웃 구조" section="layout" />
                {expandedSections.layout && (
                  <div className="py-2">
                    <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.layoutStructure)}</p>
                    
                    {!isEmpty(guide.content.layoutStructure) && (
                      <div className="mt-4 border rounded-md p-3">
                        <div className="text-center text-xs text-muted-foreground mb-2">레이아웃 구조 예시</div>
                        <div className="flex flex-col space-y-2">
                          <div className="w-full h-12 bg-primary/20 rounded flex items-center justify-center text-xs">헤더 영역</div>
                          <div className="w-full flex space-x-2 h-24">
                            <div className="w-1/3 bg-primary/10 rounded flex items-center justify-center text-xs">메인 이미지</div>
                            <div className="w-2/3 bg-primary/15 rounded flex items-center justify-center text-xs">상품 정보</div>
                          </div>
                          <div className="w-full h-32 bg-primary/10 rounded flex items-center justify-center text-xs">상세 콘텐츠 영역</div>
                          <div className="w-full h-12 bg-primary/20 rounded flex items-center justify-center text-xs">푸터 영역</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* 기술 참고사항 섹션 */}
              <div>
                <SectionHeader title="기술 참고사항" section="technical" />
                {expandedSections.technical && (
                  <div className="py-2">
                    <p className="text-sm whitespace-pre-line">{getValueOrDefault(guide.content.technicalNotes)}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="markdown" className="m-0">
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] text-sm">
                  {convertGuideToMarkdown(guide)}
                </pre>
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyToClipboard}
                >
                  <Clipboard className="w-4 h-4 mr-1" />
                  복사
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={handleDownloadMarkdown}>
            <FileText className="w-4 h-4 mr-1" />
            마크다운
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
            <FileText className="w-4 h-4 mr-1" />
            HTML
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4 mr-1" />
            PDF
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 