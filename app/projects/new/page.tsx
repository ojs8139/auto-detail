"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as ProjectService from "@/lib/project-service";
import { useState } from "react";

// 폼 스키마 정의
const formSchema = z.object({
  name: z.string().min(2, {
    message: "프로젝트 이름은 2글자 이상이어야 합니다.",
  }),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewProject() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // 제출 핸들러
  async function onSubmit(data: FormValues) {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // 새 프로젝트 생성
      const newProject = await ProjectService.createProject({
        name: data.name,
        description: data.description || "",
        status: true,
      });
      
      if (newProject) {
        // 성공 후 프로젝트 상세 페이지로 이동
        router.push(`/projects/${newProject.id}`);
      } else {
        throw new Error("프로젝트를 생성할 수 없습니다.");
      }
    } catch (error) {
      console.error("프로젝트 생성 오류:", error);
      alert("프로젝트 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">새 프로젝트 생성</h1>
        <p className="text-muted-foreground">
          상세페이지 생성을 위한 새 프로젝트를 만듭니다.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 이름</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="새 프로젝트"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>프로젝트 설명 (선택사항)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="프로젝트에 대한 간단한 설명"
                      disabled={isSubmitting}
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row sm:justify-end sm:space-x-2">
              <Link href="/">
                <Button type="button" variant="outline" className="mb-2 sm:mb-0" disabled={isSubmitting}>
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "생성 중..." : "생성하기"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
} 