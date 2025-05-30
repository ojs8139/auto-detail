"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseClient } from "@/lib/supabase";

// 스키마 SQL 파일의 경로 (public 폴더 내에 있어야 함)
const SCHEMA_SQL_PATH = '/schema.sql';

interface SupabaseSchemaDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function SupabaseSchemaDialog({ trigger, onSuccess }: SupabaseSchemaDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [schemaContent, setSchemaContent] = useState<string>('');
  const { toast } = useToast();

  // 스키마 SQL 파일 불러오기
  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await fetch(SCHEMA_SQL_PATH);
        if (!response.ok) {
          throw new Error(`Failed to load schema.sql: ${response.statusText}`);
        }
        const content = await response.text();
        setSchemaContent(content);
      } catch (error) {
        console.error("스키마 파일 로드 오류:", error);
      }
    };

    fetchSchema();
  }, []);

  const handleCreateSchema = async () => {
    if (!schemaContent) {
      toast({
        title: "스키마 파일 오류",
        description: "스키마 SQL 파일을 불러올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        toast({
          title: "Supabase 연결 오류",
          description: "Supabase 클라이언트를 초기화할 수 없습니다. 설정을 확인하세요.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // 스키마 SQL 문 실행
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: schemaContent });
      
      if (error) {
        // Supabase 인스턴스에 rpc 함수가 없는 경우 대체 방법 시도
        // SQL 스크립트를 개별 명령으로 나누어 실행
        const sqlCommands = schemaContent.split(';').filter((cmd: string) => cmd.trim() !== '');
        
        let hasError = false;
        for (const cmd of sqlCommands) {
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: cmd + ';' });
          
          if (cmdError) {
            console.error("SQL 명령 실행 오류:", cmdError);
            hasError = true;
          }
        }
        
        if (hasError) {
          toast({
            title: "스키마 생성 오류",
            description: "일부 SQL 명령이 실행되지 않았습니다. Supabase 대시보드에서 직접 스키마를 생성해주세요.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      
      toast({
        title: "스키마 생성 완료",
        description: "Supabase 데이터베이스 스키마가 성공적으로 생성되었습니다.",
      });
      
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("스키마 생성 오류:", error);
      toast({
        title: "스키마 생성 오류",
        description: `스키마 생성 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Supabase 스키마 생성
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supabase 스키마 생성</DialogTitle>
          <DialogDescription>
            Supabase 데이터베이스에 필요한 테이블과 관계를 생성합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            이 작업은 다음 테이블을 생성합니다:
          </p>
          <ul className="list-disc pl-5 mt-2 text-sm">
            <li>projects - 프로젝트 정보</li>
            <li>assets - 이미지 및 텍스트 에셋</li>
            <li>contents - 생성된 콘텐츠</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            기존 테이블이 있는 경우 영향을 받지 않지만, 테이블 구조가 다르면 충돌이 발생할 수 있습니다.
          </p>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            onClick={handleCreateSchema}
            disabled={isLoading || !schemaContent}
          >
            {isLoading ? "생성 중..." : "스키마 생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 