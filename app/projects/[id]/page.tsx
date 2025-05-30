"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Project, StyleGuide } from "@/lib/types";
import { getOpenAIApiKey } from "@/lib/openai";
import { ApiKeyDialog } from "@/components/ui/api-key-dialog";
import { Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as ProjectService from "@/lib/project-service";

// 프로젝트의 스타일 가이드를 위한 확장 인터페이스
interface ProjectWithStyleGuide extends Project {
  styleGuide?: StyleGuide;
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<ProjectWithStyleGuide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);

  useEffect(() => {
    // 프로젝트 로드
    const loadProject = async () => {
      try {
        const projectData = await ProjectService.getProject(projectId);
        if (!projectData) {
          router.push('/');
          return;
        }
        
        setProject(projectData as ProjectWithStyleGuide);
      } catch (error) {
        console.error('프로젝트 로딩 오류:', error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId, router]);

  // 프로젝트 삭제 핸들러
  const handleDelete = async () => {
    if (showDeleteConfirm) {
      try {
        const success = await ProjectService.deleteProject(projectId);
        if (success) {
          router.push('/');
        } else {
          alert('프로젝트 삭제 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('프로젝트 삭제 오류:', error);
        alert('프로젝트 삭제 중 오류가 발생했습니다.');
      }
    } else {
      setShowDeleteConfirm(true);
    }
  };

  // API 키 설정 후 콜백
  const handleApiKeySet = () => {
    // API 키 설정 후 할 작업이 있다면 여기에 추가
  };

  // 로딩 상태 표시
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[50vh]">로딩 중...</div>;
  }

  // 프로젝트가 존재하지 않을 경우
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold">프로젝트를 찾을 수 없습니다</h1>
        <p className="text-muted-foreground">요청하신 프로젝트가 존재하지 않거나 삭제되었습니다.</p>
        <Link href="/">
          <Button>대시보드로 돌아가기</Button>
        </Link>
      </div>
    );
  }

  // API 키 존재 여부 확인
  const hasApiKey = !!getOpenAIApiKey();

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsApiKeyDialogOpen(true)}
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              API 키 {hasApiKey ? '변경' : '설정'}
            </Button>
            <Link href="/">
              <Button variant="outline">목록으로</Button>
            </Link>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
            >
              {showDeleteConfirm ? "정말 삭제할까요?" : "삭제"}
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground">
          {project.description || "프로젝트 설명이 없습니다."}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>자료 등록</CardTitle>
                <CardDescription>상세 페이지 생성에 필요한 자료를 등록합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>이미지, 텍스트, URL 등의 자료를 등록하여 상세 페이지 생성에 활용합니다.</p>
              </CardContent>
              <CardFooter>
                <Link href={`/projects/${projectId}/upload`} className="w-full">
                  <Button className="w-full">자료 등록하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>상세 페이지 에디터</CardTitle>
                <CardDescription>OpenAI를 활용하여 상세 페이지를 생성합니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>등록된 자료를 바탕으로 AI가 상세 페이지 콘텐츠를 생성합니다.</p>
                {!hasApiKey && (
                  <p className="text-yellow-600 text-sm mt-2">
                    AI 기능을 사용하려면 OpenAI API 키를 설정해야 합니다.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Link href={`/projects/${projectId}/editor`} className="w-full">
                  <Button className="w-full" disabled={!hasApiKey}>
                    에디터 열기
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>프로젝트 설정</CardTitle>
              <CardDescription>프로젝트 정보와 설정을 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <h3 className="text-lg font-medium">프로젝트 정보</h3>
                  <p className="text-sm text-muted-foreground">기본 정보</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm font-medium">이름</p>
                      <p className="text-sm">{project.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">생성일</p>
                      <p className="text-sm">{new Date(project.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">스타일 가이드</h3>
                  <p className="text-sm text-muted-foreground">상세 페이지에 적용할 스타일 가이드</p>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm font-medium">메인 색상</p>
                      <div 
                        className="w-8 h-8 rounded-full mt-1" 
                        style={{ backgroundColor: project.styleGuide?.mainColor || '#000000' }}
                      ></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">폰트</p>
                      <p className="text-sm">{project.styleGuide?.font || '기본 폰트'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => alert('준비 중인 기능입니다.')}>
                설정 변경하기
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <ApiKeyDialog 
        open={isApiKeyDialogOpen}
        onOpenChange={setIsApiKeyDialogOpen}
        onApiKeySet={handleApiKeySet}
      />
    </div>
  );
} 