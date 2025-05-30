"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, PlusCircle, List, LayoutGrid, ArrowRight } from "lucide-react";
import { getAllProjects } from "@/lib/storage";
import { Project } from "@/lib/types";
import { loadMockData, SAMPLE_PROJECT_ID } from "@/lib/mockData";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // 프로젝트 목록 불러오기
  useEffect(() => {
    // 목업 데이터 로드 (샘플 프로젝트 포함)
    loadMockData();
    
    const loadProjects = async () => {
      try {
        setIsLoading(true);
        const projectList = await getAllProjects();
        setProjects(projectList);
      } catch (error) {
        console.error('프로젝트 목록 불러오기 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProjects();
  }, []);
  
  // 날짜 포맷 함수
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // 로딩 화면
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">프로젝트</h1>
          <p className="text-muted-foreground">
            생성한 상세 페이지 프로젝트 목록입니다.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              className="rounded-none px-3 h-9"
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              className="rounded-none px-3 h-9"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Link href="/projects/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              새 프로젝트
            </Button>
          </Link>
        </div>
      </div>
      
      {projects.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">등록된 프로젝트가 없습니다</h3>
          <p className="text-muted-foreground mb-6">새 프로젝트를 생성하여 시작해보세요.</p>
          <Link href="/projects/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              새 프로젝트 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
          {projects.map((project) => (
            <Card key={project.id} className={view === 'list' ? "flex flex-row" : ""}>
              <div className={view === 'list' ? "flex-1" : ""}>
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    {project.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">생성일:</span> {formatDate(project.createdAt)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">마지막 수정일:</span> {formatDate(project.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </div>
              <CardFooter className={view === 'list' ? "flex items-center" : ""}>
                <div className="flex space-x-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button variant="outline">
                      프로젝트 보기
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/projects/${project.id}/editor`}>
                    <Button>
                      에디터로 이동
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 