"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  Save, 
  Download, 
  FileText, 
  CheckCircle, 
  Clock,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { getProject, saveContent, getProjectContents, deleteContent, GeneratedContent } from "@/lib/storage";
import { 
  getProjectImages, 
  getProjectTexts, 
  getShopUrl 
} from "@/lib/assets";
import { 
  getOpenAIApiKey, 
  generateDetailContent, 
  analyzeImage 
} from "@/lib/openai";
import { ImageAsset, TextContent, Project } from "@/lib/types";
import { loadMockData, SAMPLE_PROJECT_ID } from "@/lib/mockData";
import {
  generateDesignerGuide,
} from '@/lib/services/designerGuideService';
import type { DesignerGuide as DesignerGuideType } from '@/lib/services/designerGuideService';
import { DesignerGuide } from '@/components/ui/designer-guide';

// 동적으로 불러오는 무거운 컴포넌트들
// 이 컴포넌트들은 조건부로 로드되어 실제 사용됨
// @ts-expect-error: Next.js 동적 임포트 타입 문제 해결
const ImageEditor = dynamic(() => import('@/components/ui/image-editor'), { 
  loading: () => <LoadingPlaceholder height="400px" />,
  ssr: false
});

// @ts-expect-error: Next.js 동적 임포트 타입 문제 해결
const ImageSelector = dynamic(() => import('@/components/ui/image-selector'), { 
  loading: () => <LoadingPlaceholder height="300px" />,
  ssr: false
});

// @ts-expect-error: Next.js 동적 임포트 타입 문제 해결
const CanvasPreview = dynamic(() => import('@/components/ui/canvas-preview'), { 
  loading: () => <LoadingPlaceholder height="500px" />,
  ssr: false
});

// @ts-expect-error: Next.js 동적 임포트 타입 문제 해결
const ResponsivePreview = dynamic(() => import('@/components/ui/responsive-preview'), { 
  loading: () => <LoadingPlaceholder height="500px" />,
  ssr: false
});

// @ts-expect-error: Next.js 동적 임포트 타입 문제 해결
const CanvasMergerPreview = dynamic(() => import('@/components/ui/canvas-merger-preview'), { 
  loading: () => <LoadingPlaceholder height="500px" />,
  ssr: false
});

// @ts-expect-error: Next.js 동적 임포트 타입 문제 해결
const HiResPreview = dynamic(() => import('@/components/ui/hi-res-preview'), { 
  loading: () => <LoadingPlaceholder height="500px" />,
  ssr: false
});

// 로딩 플레이스홀더 컴포넌트
const LoadingPlaceholder = ({ height = '200px' }: { height?: string }) => (
  <div className="flex items-center justify-center w-full" style={{ height }}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id || '';
  
  // 상태
  const [project, setProject] = useState<Project | null>(null);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [texts, setTexts] = useState<TextContent[]>([]);
  const [shopUrl, setShopUrl] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedContents, setSavedContents] = useState<GeneratedContent[]>([]);
  const [selectedContent, setSelectedContent] = useState<GeneratedContent | null>(null);
  const [contentName, setContentName] = useState('');
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isDesignerGuideDialogOpen, setIsDesignerGuideDialogOpen] = useState(false);
  const [generatedGuide, setGeneratedGuide] = useState<DesignerGuideType | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [selectedImageForAnalysis, setSelectedImageForAnalysis] = useState<string | null>(null);
  
  // 프로젝트 및 자료 불러오기
  const loadProject = async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    
    const projectData = getProject(projectId);
    if (!projectData) {
      router.push('/projects');
      return;
    }
    
    setProject(projectData);
    
    try {
      // 이미지, 텍스트, 쇼핑몰 URL 비동기로 불러오기
      const projectImages = await getProjectImages(projectId);
      const projectTexts = await getProjectTexts(projectId);
      const url = await getShopUrl(projectId);
      
      setImages(projectImages);
      setTexts(projectTexts);
      setShopUrl(url);
    } catch (error) {
      console.error('자료 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 저장된 콘텐츠 불러오기
  const loadSavedContents = () => {
    if (!projectId) return;
    
    const contents = getProjectContents(projectId);
    setSavedContents(contents);
  };

  // 컴포넌트 초기화
  useEffect(() => {
    if (projectId) {
      // 목업 데이터 로드 (프로젝트 ID가 샘플 ID와 일치하는 경우)
      if (projectId === SAMPLE_PROJECT_ID) {
        loadMockData();
      }
      
      // 비동기 함수 호출
      loadProject();
      loadSavedContents();
    }
  }, [projectId, router]);

  // 분석 결과 정돈 함수
  const formatAnalysisResult = (analysis: string): string => {
    // 이미 형식화된 내용이면 그대로 반환
    if (analysis.includes('<ul>') || analysis.includes('<li>') || analysis.includes('- **')) {
      return analysis;
    }
    
    // 첫 번째 문장을 추출 (마침표로 끝나는 첫 번째 문장)
    let firstSentence = '';
    const firstSentenceMatch = analysis.match(/^(.+?[.!?])\s/);
    if (firstSentenceMatch) {
      firstSentence = firstSentenceMatch[1];
      analysis = analysis.substring(firstSentence.length).trim();
    } else {
      // 마침표로 끝나는 문장이 없으면 전체를 첫 문장으로
      firstSentence = analysis;
      analysis = '';
    }
    
    // 형식화된 결과 생성
    let formattedResult = firstSentence + '\n';
    
    // 나머지 내용이 있다면 분석 카테고리별로 분류 시도
    if (analysis) {
      // 일반적인 분석 카테고리
      const categories = [
        { name: '소재', regex: /소재|재질|원단|fabric|material/i },
        { name: '디자인', regex: /디자인|design|스타일|style|외관|모양/i },
        { name: '색상', regex: /색상|color|컬러|색깔/i },
        { name: '디테일', regex: /디테일|detail|특징|feature/i },
        { name: '기능성', regex: /기능|function|성능|performance|특성/i },
        { name: '크기', regex: /크기|사이즈|size|dimensions/i },
        { name: '품질', regex: /품질|quality|내구성|durability/i }
      ];
      
      // 카테고리 발견 여부
      let categoriesFound = false;
      
      // 각 카테고리별로 관련 내용 탐색
      for (const category of categories) {
        const regex = new RegExp(`(${category.name}[^:.]*[:：]\\s*[^.!?]*(\\.|\\n|$))`, 'i');
        const match = analysis.match(regex);
        
        if (match) {
          categoriesFound = true;
          const content = match[1].replace(new RegExp(`${category.name}[^:.]*[:：]\\s*`, 'i'), '').trim();
          formattedResult += `- **${category.name}**: ${content}\n`;
        }
      }
      
      // 카테고리를 찾지 못했다면 문장 단위로 분리하여 표시
      if (!categoriesFound) {
        // 문장 단위로 분리
        const sentences = analysis.match(/[^.!?]+[.!?]+/g) || [];
        
        if (sentences.length > 0) {
          formattedResult += sentences.map(s => `- ${s.trim()}`).join('\n');
        } else {
          // 문장으로 분리되지 않으면 그대로 추가
          formattedResult += `- ${analysis}`;
        }
      }
    }
    
    return formattedResult;
  };

  // 콘텐츠 생성 함수
  const handleGenerate = async () => {
    // API 키 확인
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      setGenerationError("OpenAI API 키가 설정되지 않았습니다.");
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    setSaveSuccess(false);
    
    try {
      // 프로젝트 이름
      const projectName = project?.name || "프로젝트";
      
      // 프로젝트 설명 텍스트 (첫 번째 body 타입 텍스트 사용)
      let productText = texts.find(text => text.type === 'body')?.content || '';
      
      // 텍스트가 너무 길면 요약 (토큰 수를 줄이기 위함)
      if (productText.length > 2000) {
        productText = productText.substring(0, 2000) + '...';
        console.log('상품 설명 텍스트가 너무 길어 일부만 사용합니다.');
      }
      
      // 이미지 확인 및 필터링 (필요한 정보만 포함)
      const filteredImages = images.map(img => ({
        id: img.id,
        projectId: projectId as string,
        path: img.path || '',
        url: img.url || '',
        type: img.type || 'other'
      })).slice(0, 10); // 최대 10개 이미지로 제한
      
      if (filteredImages.length === 0) {
        console.warn('등록된 이미지가 없습니다. 이미지 없이 콘텐츠를 생성합니다.');
      }
      
      // 실제 API를 통한 상세 페이지 콘텐츠 생성
      const content = await generateDetailContent(
        projectName,
        productText,
        filteredImages,
        shopUrl
      );
      
      setGeneratedContent(content);
      setSelectedContent(null);
      
      // 생성 후 미리보기 탭으로 전환
      setActiveTab("preview");
    } catch (error) {
      console.error('콘텐츠 생성 오류:', error);
      setGenerationError((error as Error).message || '콘텐츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 이미지 분석 함수
  const handleAnalyzeImage = async (imageId: string) => {
    // API 키 확인
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      setGenerationError("OpenAI API 키가 설정되지 않았습니다.");
      return;
    }
    
    const image = images.find(img => img.id === imageId);
    if (!image) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    setSaveSuccess(false);
    setSelectedImageForAnalysis(imageId); // 현재 분석 중인 이미지 ID 설정
    
    try {
      let analysis = '';
      
      // 실제 API를 통한 이미지 분석
      analysis = await analyzeImage(image.path || image.url || '');
      
      // 분석 결과 정돈
      const formattedAnalysis = formatAnalysisResult(analysis);
      
      // 분석 결과를 에디터에 추가
      setGeneratedContent(prev => 
        prev + `\n\n<h2>이미지 분석 결과</h2>\n<p>${formattedAnalysis.replace(/\n/g, '<br>')}</p>`
      );
      
      // 생성 후 미리보기 탭으로 전환
      setActiveTab("preview");
    } catch (error) {
      console.error('이미지 분석 오류:', error);
      setGenerationError((error as Error).message || '이미지 분석 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
      setSelectedImageForAnalysis(null); // 분석 완료 후 선택된 이미지 ID 초기화
    }
  };

  // 콘텐츠 저장 다이얼로그 열기
  const handleOpenSaveDialog = () => {
    if (!generatedContent || !project) return;
    
    setContentName(`${project.name} 콘텐츠 ${savedContents.length + 1}`);
    setIsSaveDialogOpen(true);
  };

  // 콘텐츠 저장 함수
  const handleSaveContent = () => {
    if (!generatedContent || !contentName.trim()) return;
    
    // 콘텐츠 저장
    saveContent(projectId, generatedContent, contentName);
    
    // 저장된 콘텐츠 목록 업데이트
    const contents = getProjectContents(projectId);
    setSavedContents(contents);
    
    // 다이얼로그 닫기
    setIsSaveDialogOpen(false);
    
    // 성공 메시지 표시
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // 저장된 콘텐츠 로드
  const handleLoadContent = (content: GeneratedContent) => {
    setGeneratedContent(content.content);
    setSelectedContent(content);
    setActiveTab("preview");
  };

  // 저장된 콘텐츠 삭제
  const handleDeleteContent = (contentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm('이 콘텐츠를 삭제하시겠습니까?')) {
      deleteContent(contentId);
      
      // 선택된 콘텐츠가 삭제된 경우 선택 해제
      if (selectedContent?.id === contentId) {
        setSelectedContent(null);
      }
      
      // 저장된 콘텐츠 목록 업데이트
      const contents = getProjectContents(projectId);
      setSavedContents(contents);
    }
  };

  // HTML 내보내기
  const handleExportHtml = () => {
    if (!generatedContent || !project) return;
    
    // HTML 파일 생성 및 다운로드
    const blob = new Blob([generatedContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().getTime()}.html`;
    document.body.appendChild(a);
    a.click();
    
    // 정리
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // 디자이너 가이드 생성 함수
  const handleGenerateDesignerGuide = async () => {
    if (!generatedContent || !project) return;

    try {
      setIsGeneratingGuide(true);
      
      // 프로젝트의 이미지 자산 가져오기
      const projectImages = Array.isArray(project.images) ? project.images.map(img => ({
        id: img.id || '',
        projectId: projectId as string,
        url: img.url || img.path || '',
        filename: img.filename || `이미지-${img.id || ''}`,
        type: img.type || 'other',
      })) : [];
      
      // 디자이너 가이드 생성
      const guide = await generateDesignerGuide(
        projectId,
        project.name,
        generatedContent,
        project.styleGuide,
        projectImages,
        { customPrompt: '쇼핑몰 상세페이지를 위한 디자인 가이드입니다.' }
      );
      
      setGeneratedGuide(guide);
      setIsDesignerGuideDialogOpen(true);
    } catch (error) {
      console.error('디자이너 가이드 생성 오류:', error);
      setGenerationError((error as Error).message || '디자이너 가이드 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // 로딩 상태 표시
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">콘텐츠 에디터</h1>
          <div className="flex space-x-2">
            <Link href={`/projects/${projectId}/upload`}>
              <Button variant="outline">자료 등록으로 돌아가기</Button>
            </Link>
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline">프로젝트로 돌아가기</Button>
            </Link>
          </div>
        </div>
        
        <p className="text-muted-foreground">
          OpenAI를 활용하여 상세 페이지 콘텐츠를 생성하고 편집합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>자료 요약</CardTitle>
              <CardDescription>등록된 자료 정보</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">이미지</h3>
                <p className="text-sm text-muted-foreground">
                  {images.length}개의 이미지가 등록되어 있습니다.
                </p>
                {images.length > 0 && (
                  <>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {images.slice(0, 4).map((image) => (
                        <div key={image.id} className="relative group rounded-lg overflow-hidden border">
                          <img
                            src={image.path}
                            alt={`Image ${image.id}`}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleAnalyzeImage(image.id)}
                              disabled={isGenerating && selectedImageForAnalysis === image.id}
                            >
                              {isGenerating && selectedImageForAnalysis === image.id ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  분석 중
                                </>
                              ) : "분석"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {images.length > 4 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => setIsImageGalleryOpen(true)}
                      >
                        모든 이미지 보기 ({images.length}개)
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <div>
                <h3 className="font-medium">텍스트</h3>
                <p className="text-sm text-muted-foreground">
                  {texts.length}개의 텍스트가 등록되어 있습니다.
                </p>
                {texts.length > 0 && (
                  <div className="mt-2 text-sm max-h-24 overflow-y-auto border rounded-md p-2">
                    {texts[0]?.content.substring(0, 200)}
                    {texts[0]?.content.length > 200 ? '...' : ''}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium">쇼핑몰 URL</h3>
                <p className="text-sm text-muted-foreground">
                  {shopUrl ? '등록됨' : '등록되지 않음'}
                </p>
                {shopUrl && (
                  <div className="mt-2 text-sm border rounded-md p-2">
                    <a 
                      href={shopUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {shopUrl}
                    </a>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || (!images.length && !texts.length)}
                className="w-full"
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGenerating ? "생성 중..." : "콘텐츠 생성하기"}
              </Button>
              
              {generationError && (
                <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                  {generationError}
                </div>
              )}
              
              {saveSuccess && (
                <div className="text-sm text-green-600 p-2 bg-green-50 rounded flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  콘텐츠가 성공적으로 저장되었습니다.
                </div>
              )}
            </CardContent>
          </Card>
          
          {savedContents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>저장된 콘텐츠</CardTitle>
                <CardDescription>이전에 생성하고 저장한 콘텐츠</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedContents.map((content) => (
                    <div
                      key={content.id}
                      className={`p-2 border rounded-md cursor-pointer hover:border-primary flex justify-between items-center ${
                        selectedContent?.id === content.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleLoadContent(content)}
                    >
                      <div>
                        <div className="font-medium">{content.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(content.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteContent(content.id, e)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="md:col-span-2">
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div className="flex-grow">
                <Tabs 
                  value={activeTab} 
                  onValueChange={setActiveTab} 
                  className="w-full"
                >
                  <div className="flex justify-between items-center">
                    <TabsList className="grid w-[200px] grid-cols-2">
                      <TabsTrigger value="preview">미리보기</TabsTrigger>
                      <TabsTrigger value="html">HTML</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex space-x-2">
                      {generatedContent && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleOpenSaveDialog}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            저장
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleExportHtml}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            내보내기
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleGenerateDesignerGuide}
                            disabled={isGeneratingGuide}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            {isGeneratingGuide ? '생성 중...' : '디자인 가이드'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="border rounded-md mt-4">
                    <TabsContent value="preview" className="p-4 min-h-[600px] m-0">
                      {generatedContent ? (
                        <div 
                          className="prose prose-img:rounded-md prose-img:mx-auto prose-headings:mb-3 max-w-none"
                          dangerouslySetInnerHTML={{ __html: generatedContent }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[600px] text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mb-4 text-muted-foreground/60" />
                          <p>콘텐츠를 생성해주세요.</p>
                          <p className="text-sm mt-2">
                            왼쪽 패널에서 "콘텐츠 생성하기" 버튼을 클릭하면 자동으로 콘텐츠가 생성됩니다.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="html" className="m-0 min-h-[600px]">
                      {generatedContent ? (
                        <div className="relative h-[600px]">
                          <pre className="bg-muted p-4 rounded-md overflow-auto h-full text-sm">
                            {generatedContent}
                          </pre>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => navigator.clipboard.writeText(generatedContent)}
                          >
                            복사
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[600px] text-center text-muted-foreground">
                          <FileText className="h-12 w-12 mb-4 text-muted-foreground/60" />
                          <p>콘텐츠를 생성해주세요.</p>
                          <p className="text-sm mt-2">
                            왼쪽 패널에서 "콘텐츠 생성하기" 버튼을 클릭하면 자동으로 콘텐츠가 생성됩니다.
                          </p>
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 콘텐츠 저장 대화상자 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>콘텐츠 저장</DialogTitle>
            <DialogDescription>
              생성된 콘텐츠에 이름을 지정하고 저장합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="content-name">콘텐츠 이름</Label>
              <Input
                id="content-name"
                placeholder="콘텐츠 이름을 입력하세요"
                value={contentName}
                onChange={(e) => setContentName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSaveContent} disabled={!contentName.trim()}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 디자이너 가이드 다이얼로그 */}
      <Dialog open={isDesignerGuideDialogOpen} onOpenChange={setIsDesignerGuideDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>웹디자이너 가이드</DialogTitle>
            <DialogDescription>
              상세페이지 제작을 위한 디자인 가이드입니다. 마크다운, HTML, PDF 형식으로 다운로드 가능합니다.
            </DialogDescription>
          </DialogHeader>
          
          {generatedGuide && (
            <DesignerGuide guide={generatedGuide} />
          )}
        </DialogContent>
      </Dialog>

      {/* 이미지 갤러리 모달 */}
      <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>프로젝트 이미지 갤러리</DialogTitle>
            <DialogDescription>
              총 {images.length}개의 이미지가 등록되어 있습니다. 이미지 위에 마우스를 올려 분석 옵션을 확인하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
            {images.map((image) => (
              <div key={image.id} className="relative group rounded-lg overflow-hidden border">
                <img
                  src={image.path}
                  alt={`Image ${image.id}`}
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                  <p className="text-white text-xs mb-2 text-center truncate w-full">
                    {image.filename || `이미지 ${image.id}`}
                  </p>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      handleAnalyzeImage(image.id);
                      setIsImageGalleryOpen(false);
                    }}
                    disabled={isGenerating && selectedImageForAnalysis === image.id}
                  >
                    {isGenerating && selectedImageForAnalysis === image.id ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        분석 중...
                      </>
                    ) : "이미지 분석"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsImageGalleryOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 