"use client";

import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOpenAIApiKey, saveOpenAIApiKey, testApiConnection } from "@/lib/openai";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

// 환경 변수 API 키는 .env 파일에서 OPENAI_API_KEY로 설정하고, 코드에 직접 포함하지 않습니다

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySet?: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  onApiKeySet,
}: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState<string>(getOpenAIApiKey() || "");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // API 키 저장 핸들러
  const handleSave = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: "API 키를 입력해주세요."
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      // API 연결 테스트
      const isValid = await testApiConnection(apiKey);
      
      if (isValid) {
        // 유효한 API 키 저장
        saveOpenAIApiKey(apiKey);
        setTestResult({
          success: true,
          message: "API 연결이 성공적으로 확인되었습니다."
        });
        
        // 콜백 호출
        if (onApiKeySet) {
          setTimeout(() => {
            onApiKeySet();
            onOpenChange(false);
          }, 1500);
        }
      } else {
        setTestResult({
          success: false,
          message: "API 키가 유효하지 않습니다. 다시 확인해주세요."
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "API 연결 중 오류가 발생했습니다. 다시 시도해주세요."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>OpenAI API 키 설정</DialogTitle>
          <DialogDescription>
            OpenAI API를 사용하여 텍스트 생성 및 이미지 분석 기능을 활용하려면 API 키가 필요합니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API 키</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              API 키는 로컬 스토리지에 저장되며 서버로 전송되지 않습니다.
            </p>
          </div>
          
          {testResult && (
            <div className={`flex items-center gap-2 p-2 rounded text-sm ${
              testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {testResult.message}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "연결 테스트 중..." : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 