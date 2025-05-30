"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Button } from "./button";
import { RegenerationHistory } from "./regeneration-history";
import { History } from "lucide-react";
import type { RegenerationResult } from "@/lib/regeneration-service";

export interface HistoryDialogProps {
  /**
   * 트리거 요소 또는 버튼 텍스트
   */
  trigger?: React.ReactNode;
  
  /**
   * 요소 ID
   */
  elementId: string;
  
  /**
   * 요소 타입
   */
  elementType: 'text' | 'image' | 'shape';
  
  /**
   * 히스토리 데이터
   */
  history: RegenerationResult[];
  
  /**
   * 특정 버전으로 롤백 시 호출되는 콜백
   */
  onRollback?: (elementId: string, resultId: string) => void;
  
  /**
   * 마지막 재생성 작업 실행 취소 시 호출되는 콜백
   */
  onUndo?: (elementId: string) => void;
  
  /**
   * 다이얼로그가 열릴 때 호출되는 콜백
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * 히스토리 다이얼로그 컴포넌트
 */
export function HistoryDialog({
  trigger,
  elementId,
  elementType,
  history,
  onRollback,
  onUndo,
  onOpenChange,
}: HistoryDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <History className="h-4 w-4 mr-2" />
            히스토리
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>재생성 히스토리</DialogTitle>
          <DialogDescription>
            이전 재생성 작업의 기록을 확인하고 필요한 경우 복원할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <RegenerationHistory
            elementId={elementId}
            elementType={elementType}
            history={history}
            onRollback={onRollback}
            onUndo={onUndo}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 