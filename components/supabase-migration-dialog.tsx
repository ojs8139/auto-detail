"use client";

import { useState } from "react";
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
import { hasSupabaseCredentials } from "@/lib/supabase";
import { migrateAllData, downloadAllData, syncData } from "@/lib/migration";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface SupabaseMigrationDialogProps {
  trigger?: React.ReactNode;
  onComplete?: () => void;
}

type MigrationType = 'upload' | 'download' | 'sync';

export function SupabaseMigrationDialog({ trigger, onComplete }: SupabaseMigrationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [migrationType, setMigrationType] = useState<MigrationType>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: any;
  } | null>(null);
  const { toast } = useToast();

  const handleMigration = async () => {
    if (!hasSupabaseCredentials()) {
      toast({
        title: "설정 필요",
        description: "Supabase 연결 설정을 먼저 완료해주세요.",
        variant: "destructive",
      });
      setIsOpen(false);
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      let migrationResult;
      
      switch (migrationType) {
        case 'upload':
          migrationResult = await migrateAllData();
          break;
        case 'download':
          migrationResult = await downloadAllData();
          break;
        case 'sync':
          migrationResult = await syncData();
          break;
      }
      
      setResult(migrationResult);
      
      if (migrationResult.success) {
        toast({
          title: "마이그레이션 완료",
          description: migrationResult.message,
        });
        if (onComplete) onComplete();
      } else {
        toast({
          title: "마이그레이션 실패",
          description: migrationResult.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: `작업 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      });
      
      toast({
        title: "오류 발생",
        description: `데이터 마이그레이션 중 문제가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
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
            데이터 마이그레이션
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Supabase 데이터 마이그레이션</DialogTitle>
          <DialogDescription>
            로컬 스토리지와 Supabase 데이터베이스 간에 데이터를 이동할 방법을 선택하세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup
            value={migrationType}
            onValueChange={(value) => setMigrationType(value as MigrationType)}
            className="space-y-4"
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="upload" id="migrate-upload" />
              <div className="grid gap-1.5">
                <Label htmlFor="migrate-upload" className="font-medium">
                  로컬 → Supabase 업로드
                </Label>
                <p className="text-sm text-muted-foreground">
                  로컬 스토리지에 있는 모든 프로젝트, 에셋, 콘텐츠를 Supabase 데이터베이스로 업로드합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="download" id="migrate-download" />
              <div className="grid gap-1.5">
                <Label htmlFor="migrate-download" className="font-medium">
                  Supabase → 로컬 다운로드
                </Label>
                <p className="text-sm text-muted-foreground">
                  Supabase 데이터베이스에 있는 모든 프로젝트, 에셋, 콘텐츠를 로컬 스토리지로 다운로드합니다.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="sync" id="migrate-sync" />
              <div className="grid gap-1.5">
                <Label htmlFor="migrate-sync" className="font-medium">
                  양방향 동기화
                </Label>
                <p className="text-sm text-muted-foreground">
                  로컬과 Supabase에 있는 데이터를 양방향으로 동기화합니다. 이름이 같은 프로젝트는 충돌로 간주됩니다.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        {result && (
          <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-950 text-red-800 dark:text-red-200'}`}>
            <p className="font-medium">{result.message}</p>
            {result.stats && (
              <div className="mt-2 text-sm">
                {migrationType === 'sync' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium">업로드됨:</p>
                      <ul className="list-disc pl-5">
                        <li>프로젝트: {result.stats.uploaded.projects}개</li>
                        <li>에셋: {result.stats.uploaded.assets}개</li>
                        <li>콘텐츠: {result.stats.uploaded.contents}개</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium">다운로드됨:</p>
                      <ul className="list-disc pl-5">
                        <li>프로젝트: {result.stats.downloaded.projects}개</li>
                        <li>에셋: {result.stats.downloaded.assets}개</li>
                        <li>콘텐츠: {result.stats.downloaded.contents}개</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <ul className="list-disc pl-5">
                    <li>프로젝트: {result.stats.projects}개</li>
                    <li>에셋: {result.stats.assets}개</li>
                    <li>콘텐츠: {result.stats.contents}개</li>
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          <Button
            type="button"
            onClick={handleMigration}
            disabled={isLoading}
          >
            {isLoading ? '진행 중...' : '마이그레이션 시작'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 