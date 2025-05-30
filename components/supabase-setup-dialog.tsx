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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { setSupabaseCredentials, testSupabaseConnection, hasSupabaseCredentials } from "@/lib/supabase";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SupabaseSetupDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

// 환경 변수로 Supabase가 설정되어 있는지 확인
const isSupabaseConfiguredInEnv = (): boolean => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

export function SupabaseSetupDialog({ trigger, onSuccess }: SupabaseSetupDialogProps) {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(hasSupabaseCredentials());
  const { toast } = useToast();
  const useEnvConfig = isSupabaseConfiguredInEnv();

  useEffect(() => {
    setIsConfigured(useEnvConfig || hasSupabaseCredentials());
  }, [useEnvConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (useEnvConfig) {
      toast({
        title: "환경 변수로 설정됨",
        children: (
          <p>Supabase는 이미 환경 변수로 설정되어 있습니다. 이 설정은 무시됩니다.</p>
        )
      });
      setIsOpen(false);
      return;
    }
    
    if (!url || !key) {
      toast({
        title: "입력 오류",
        variant: "destructive",
        children: (
          <p>Supabase URL과 API 키를 모두 입력해주세요.</p>
        )
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 자격 증명 설정
      setSupabaseCredentials(url, key);
      
      // 연결 테스트
      const result = await testSupabaseConnection();
      
      if (result.success) {
        toast({
          title: "설정 완료",
          children: (
            <p>Supabase 연결이 성공적으로 구성되었습니다.</p>
          )
        });
        setIsConfigured(true);
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "연결 오류",
          variant: "destructive",
          children: (
            <p>{result.message}</p>
          )
        });
      }
    } catch (error) {
      toast({
        title: "오류 발생",
        variant: "destructive",
        children: (
          <p>Supabase 연결 설정 중 문제가 발생했습니다.</p>
        )
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={isConfigured ? "outline" : "default"}>
            {isConfigured ? "Supabase 설정 확인" : "Supabase 설정"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supabase 연결 설정</DialogTitle>
          <DialogDescription>
            {useEnvConfig 
              ? "Supabase는 환경 변수를 통해 자동으로 설정되었습니다." 
              : "Supabase 프로젝트 URL과 API 키를 입력하여 데이터 동기화를 구성하세요."}
          </DialogDescription>
        </DialogHeader>
        
        {useEnvConfig ? (
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>환경 변수로 설정됨</AlertTitle>
              <AlertDescription>
                Supabase는 다음 환경 변수로 구성되었습니다:
                <ul className="mt-2 ml-4 list-disc">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                </ul>
                <p className="mt-2">이 설정은 직접 수정할 수 없으며, 환경 변수를 변경해야 합니다.</p>
              </AlertDescription>
            </Alert>
            <DialogFooter className="mt-4">
              <Button onClick={() => setIsOpen(false)}>확인</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supabase-url" className="text-right">
                  URL
                </Label>
                <Input
                  id="supabase-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="supabase-key" className="text-right">
                  API 키
                </Label>
                <Input
                  id="supabase-key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  type="password"
                  placeholder="your-api-key"
                  className="col-span-3"
                />
              </div>
              <div className="col-span-4">
                <p className="text-sm text-muted-foreground mt-2">
                  Supabase 프로젝트 설정에서 URL과 anon 또는 service_role 키를 찾을 수 있습니다.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "연결 중..." : "연결 테스트 및 저장"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 