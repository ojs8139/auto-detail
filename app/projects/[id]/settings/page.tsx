"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProject, updateProject, deleteProject } from "@/lib/project-service";
import { Project } from "@/lib/types";

// 폼 스키마 정의
const formSchema = z.object({
  name: z.string().min(2, {
    message: "프로젝트 이름은 2글자 이상이어야 합니다.",
  }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProjectSettings() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    // 프로젝트 로드
    const loadProject = async () => {
      try {
        const projectData = await getProject(projectId);
        
        if (projectData) {
          setProject(projectData);
          
          // 폼 값 설정
          form.reset({
            name: projectData.name,
            description: projectData.description || "",
          });
        }
      } catch (error) {
        console.error("프로젝트 로드 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProject();
  }, [projectId, form]);

  // 프로젝트 업데이트 핸들러
  async function onSubmit(data: FormValues) {
    try {
      // 프로젝트 업데이트
      const updatedProject = await updateProject(projectId, {
        name: data.name,
        description: data.description,
      });
      
      if (updatedProject) {
        setProject(updatedProject);
        alert("프로젝트가 성공적으로 업데이트되었습니다.");
        router.push(`/projects/${projectId}`);
      } else {
        alert("프로젝트를 찾을 수 없습니다.");
      }
    } catch (error) {
      console.error("프로젝트 업데이트 오류:", error);
      alert("프로젝트 업데이트 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  }

  // 프로젝트 삭제 핸들러
  const handleDeleteProject = async () => {
    if (window.confirm("정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      try {
        await deleteProject(projectId);
        router.push("/");
      } catch (error) {
        console.error("프로젝트 삭제 오류:", error);
        alert("프로젝트 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
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

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">프로젝트 설정</h1>
        <p className="text-muted-foreground">
          프로젝트 정보를 수정하거나 삭제합니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              프로젝트 이름
            </label>
            <input
              {...form.register("name")}
              id="name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              프로젝트 설명 (선택사항)
            </label>
            <textarea
              {...form.register("description")}
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDeleteProject}
              className="mb-2 sm:mb-0"
            >
              프로젝트 삭제
            </Button>

            <div className="flex flex-col sm:flex-row sm:space-x-2">
              <Link href={`/projects/${projectId}`}>
                <Button type="button" variant="outline" className="mb-2 sm:mb-0 w-full sm:w-auto">
                  취소
                </Button>
              </Link>
              <Button type="submit" className="w-full sm:w-auto">저장</Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 