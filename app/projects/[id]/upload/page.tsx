"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileUpload } from "@/components/ui/file-upload";
import { ImagePreview } from "@/components/ui/image-preview";
import { TextEditor } from "@/components/ui/text-editor";
import { UrlInput } from "@/components/ui/url-input";
import { getProject } from "@/lib/storage";
import { 
  getProjectImages, 
  saveImageAsset, 
  deleteImageAsset, 
  getProjectTexts, 
  saveTextContent, 
  getShopUrl, 
  saveShopUrl,
  deleteTextAsset
} from "@/lib/assets";
import { ImageAsset, TextContent } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [productText, setProductText] = useState<string>("");
  const [shopUrl, setShopUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("images");
  const [isUploading, setIsUploading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("로딩 중...");

  // 프로젝트 및 자료 불러오기
  useEffect(() => {
    const loadProject = async () => {
      setIsLoading(true);
      setLoadingMessage("프로젝트 정보를 불러오는 중...");
      
      const projectData = getProject(projectId);
      if (!projectData) {
        router.push('/');
        return;
      }
      
      setProject(projectData);
      
      try {
        // 이미지 불러오기
        setLoadingMessage("이미지를 불러오는 중...");
        const projectImages = await getProjectImages(projectId);
        setImages(projectImages);
        
        // 텍스트 불러오기
        setLoadingMessage("텍스트를 불러오는 중...");
        const projectTexts = await getProjectTexts(projectId);
        const mainText = projectTexts.find(text => text.type === 'body');
        if (mainText) {
          setProductText(mainText.content);
        }
        
        // URL 불러오기
        setLoadingMessage("URL을 불러오는 중...");
        const url = await getShopUrl(projectId);
        if (url) {
          setShopUrl(url);
        }
      } catch (error) {
        console.error("데이터 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId, router]);

  // 이미지 파일 처리
  const handleImageUpload = async (files: File[]) => {
    if (isUploading || files.length === 0) return;
    
    setIsUploading(true);
    setLoadingMessage(`이미지 ${files.length}개 처리 중...`);
    
    try {
      // 배치로 나누어 처리 (브라우저 부하 감소)
      const BATCH_SIZE = 5;
      const newImages: ImageAsset[] = [];
      
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        setLoadingMessage(`이미지 ${i + 1}~${Math.min(i + BATCH_SIZE, files.length)}/${files.length} 처리 중...`);
        
        // 각 배치 병렬 처리
        const batchResults = await Promise.all(
          batch.map(async (file) => {
            // 이미지 파일 확인
            if (!file.type.startsWith('image/')) {
              return null;
            }
            
            // 이미지 데이터 URL 생성
            const dataUrl = await readFileAsDataUrl(file);
            
            // 이미지 저장
            return saveImageAsset(projectId, file, dataUrl);
          })
        );
        
        // null 값 필터링하고 새 이미지 배열에 추가
        const validResults = batchResults.filter(result => result !== null) as ImageAsset[];
        newImages.push(...validResults);
        
        // 처리 완료된 배치를 즉시 UI에 반영
        setImages(prev => [...prev, ...validResults]);
      }
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
    } finally {
      setIsUploading(false);
      setLoadingMessage("");
    }
  };

  // 이미지 삭제 처리
  const handleImageDelete = async (id: string) => {
    try {
      const success = await deleteImageAsset(id);
      if (success) {
        setImages(prev => prev.filter(img => img.id !== id));
      }
    } catch (error) {
      console.error('이미지 삭제 오류:', error);
    }
  };

  // 제품 설명 텍스트 저장
  const handleTextSave = async (text: string) => {
    try {
      const projectTexts = await getProjectTexts(projectId);
      const existingText = projectTexts.find(t => t.type === 'body');
      
      if (existingText) {
        // 이미 있는 텍스트 삭제 후 새로 저장
        deleteTextAsset(existingText.id);
      }
      
      await saveTextContent(projectId, text, 'body');
      setProductText(text);
    } catch (error) {
      console.error('텍스트 저장 오류:', error);
    }
  };

  // 쇼핑몰 URL 저장
  const handleUrlSave = async (url: string) => {
    try {
      await saveShopUrl(projectId, url);
      setShopUrl(url);
    } catch (error) {
      console.error('URL 저장 오류:', error);
    }
  };

  // 파일 데이터 URL로 읽기
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert file to data URL'));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error);
      };
      
      reader.readAsDataURL(file);
    });
  };

  // 로딩 상태 표시
  if (isLoading || isUploading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[50vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">자료 등록</h1>
          <div className="flex space-x-2">
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline">돌아가기</Button>
            </Link>
            <Link href={`/projects/${projectId}/editor`}>
              <Button>에디터로 이동</Button>
            </Link>
          </div>
        </div>
        <p className="text-muted-foreground">
          상세 페이지 생성에 필요한 이미지, 설명 문서, 쇼핑몰 URL을 등록합니다.
        </p>
      </div>

      <Tabs 
        defaultValue="images" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="images">이미지</TabsTrigger>
          <TabsTrigger value="text">제품 설명</TabsTrigger>
          <TabsTrigger value="url">쇼핑몰 URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images" className="p-4 border rounded-md mt-4">
          <div className="flex flex-col space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>이미지 업로드</CardTitle>
                <CardDescription>
                  제품 이미지를 여러 장 업로드할 수 있습니다. (JPG, PNG, WebP)
                  <br />
                  <span className="text-xs text-muted-foreground mt-1">
                    * 대용량 이미지는 자동으로 최적화되어 저장됩니다. (최대 1200px)
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesSelected={handleImageUpload}
                  accept="image/*"
                  multiple={true}
                  maxFileSize={20 * 1024 * 1024} // 20MB 제한
                />
              </CardContent>
            </Card>

            {images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>업로드된 이미지 ({images.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ImagePreview 
                    images={images} 
                    onRemove={handleImageDelete} 
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="text" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader>
              <CardTitle>제품 설명</CardTitle>
              <CardDescription>
                제품에 대한 상세 설명을 입력하거나 텍스트 파일을 업로드하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TextEditor
                initialValue={productText}
                onSave={handleTextSave}
                placeholder="제품에 대한 상세 설명을 입력하세요..."
                minHeight="300px"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="url" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader>
              <CardTitle>쇼핑몰 URL</CardTitle>
              <CardDescription>
                참고할 쇼핑몰의 URL을 입력하세요. 해당 쇼핑몰의 분위기를 분석합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UrlInput
                initialValue={shopUrl}
                onSave={handleUrlSave}
                placeholder="https://example.com"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={() => router.push(`/projects/${projectId}/editor`)}
          disabled={images.length === 0 && !productText && !shopUrl}
        >
          다음: 에디터로 이동
        </Button>
      </div>
    </div>
  );
} 