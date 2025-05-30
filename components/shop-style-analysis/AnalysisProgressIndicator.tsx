/**
 * 스타일 분석 진행 상태 표시 컴포넌트
 * 스타일 분석 작업의 진행 상태와 단계를 시각적으로 표시합니다.
 */

'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// 분석 단계 타입 정의
export type AnalysisStep = {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  message?: string;
};

// 컴포넌트 속성 정의
export interface AnalysisProgressIndicatorProps {
  steps: AnalysisStep[];
  currentStep: number;
  isCompleted: boolean;
  error?: string;
  className?: string;
}

/**
 * 분석 진행 상태 표시 컴포넌트
 */
const AnalysisProgressIndicator: React.FC<AnalysisProgressIndicatorProps> = ({
  steps,
  currentStep,
  isCompleted,
  error,
  className = '',
}) => {
  // 전체 진행률 계산 (%)
  const progressPercentage = isCompleted
    ? 100
    : Math.min(Math.round((currentStep / steps.length) * 100), 100);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle2 className="text-green-500 h-5 w-5" />
          ) : error ? (
            <AlertCircle className="text-red-500 h-5 w-5" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          )}
          스타일 분석 진행 상태
        </CardTitle>
        <CardDescription>
          {isCompleted
            ? '분석이 완료되었습니다.'
            : error
            ? '분석 중 오류가 발생했습니다.'
            : `분석 진행 중... (${progressPercentage}%)`}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Progress
          value={progressPercentage}
          className={`h-2 mb-4 ${error ? 'bg-red-200' : ''}`}
          indicatorClassName={error ? 'bg-red-500' : ''}
        />

        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              {step.status === 'completed' && <CheckCircle2 className="text-green-500 h-4 w-4" />}
              {step.status === 'in-progress' && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              {step.status === 'pending' && <div className="h-4 w-4 rounded-full border border-gray-300" />}
              {step.status === 'error' && <AlertCircle className="text-red-500 h-4 w-4" />}
              
              <div className="flex-1">
                <p className={`text-sm ${step.status === 'completed' ? 'text-green-700' : 
                  step.status === 'in-progress' ? 'text-blue-700 font-medium' : 
                  step.status === 'error' ? 'text-red-700' : 
                  'text-gray-500'}`}>
                  {step.name}
                </p>
                {step.message && (
                  <p className="text-xs text-gray-500">{step.message}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            <p className="font-medium mb-1">오류 발생</p>
            <p className="text-xs">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalysisProgressIndicator; 