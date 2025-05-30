/**
 * 이미지 품질 평가 결과 표시 컴포넌트
 * 이미지의 품질 평가 결과를 시각적으로 표시합니다.
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ImageQualityAssessment } from '@/lib/services/imageQualityService';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ImageQualityAssessmentDisplayProps {
  assessment: ImageQualityAssessment;
  className?: string;
  showDetails?: boolean;
  onClick?: () => void;
}

/**
 * 품질 점수 색상 결정 함수
 */
const getScoreColor = (score: number): string => {
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.6) return 'bg-blue-500';
  if (score >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
};

/**
 * 등급 표시 컴포넌트
 */
const GradeDisplay: React.FC<{ grade: 'A' | 'B' | 'C' | 'D' | 'F' }> = ({ grade }) => {
  const gradeBgColors = {
    'A': 'bg-green-500',
    'B': 'bg-green-400',
    'C': 'bg-yellow-400',
    'D': 'bg-orange-400',
    'F': 'bg-red-500'
  };
  
  return (
    <div className={`${gradeBgColors[grade]} text-white font-bold rounded-full w-10 h-10 flex items-center justify-center text-lg`}>
      {grade}
    </div>
  );
};

/**
 * 품질 지표 표시 컴포넌트
 */
const QualityMetric: React.FC<{ 
  label: string; 
  score: number; 
  details?: string;
  icon?: React.ReactNode;
}> = ({ label, score, details, icon }) => {
  const scorePercent = score * 100;
  const scoreColor = getScoreColor(score);
  
  return (
    <div className="space-y-1 mb-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-medium">{Math.round(scorePercent)}%</span>
      </div>
      <Progress value={scorePercent} indicatorClassName={scoreColor} className="h-2" />
      {details && <p className="text-xs text-gray-500 mt-1">{details}</p>}
    </div>
  );
};

/**
 * 이미지 품질 평가 결과 표시 컴포넌트
 */
const ImageQualityAssessmentDisplay: React.FC<ImageQualityAssessmentDisplayProps> = ({ 
  assessment, 
  className = '',
  showDetails = true,
  onClick
}) => {
  // 이미지 파일명 추출
  const getImageFilename = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || 'image';
      
      // 파일명이 너무 길면 축약
      return filename.length > 20 
        ? filename.substring(0, 17) + '...' 
        : filename;
    } catch (e) {
      // URL 파싱 실패 시 기본값 반환
      return 'image';
    }
  };
  
  const imageName = getImageFilename(assessment.imageUrl);
  
  return (
    <Card className={`overflow-hidden ${className}`} onClick={onClick}>
      <div className="relative">
        <div className="h-48 bg-gray-100 relative overflow-hidden">
          <img 
            src={assessment.imageUrl} 
            alt={`Image quality assessment for ${imageName}`}
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 right-2">
            <GradeDisplay grade={assessment.overall.grade} />
          </div>
        </div>
      </div>
      
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex justify-between items-start">
          <span className="truncate">{imageName}</span>
          <span className="text-sm font-normal text-gray-500">
            {assessment.resolution.width} × {assessment.resolution.height}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 pb-4">
        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              {assessment.overall.score >= 0.7 ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-sm font-medium">종합 품질 점수</span>
            </div>
            <span className="text-sm font-medium">{Math.round(assessment.overall.score * 100)}%</span>
          </div>
          <Progress 
            value={assessment.overall.score * 100} 
            indicatorClassName={getScoreColor(assessment.overall.score)} 
            className="h-2.5" 
          />
          <p className="text-xs text-gray-500 mt-1.5">{assessment.overall.recommendation}</p>
        </div>
        
        {showDetails && (
          <div className="mt-4 space-y-2">
            <QualityMetric 
              label="해상도" 
              score={assessment.resolution.score} 
              icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <QualityMetric 
              label="선명도" 
              score={assessment.sharpness.score} 
              details={assessment.sharpness.details}
              icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <QualityMetric 
              label="노이즈" 
              score={assessment.noise.score} 
              details={`${assessment.noise.level === 'low' 
                ? '낮음' 
                : assessment.noise.level === 'medium' 
                  ? '중간' 
                  : '높음'}`}
              icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <QualityMetric 
              label="색상 품질" 
              score={assessment.colorQuality.score} 
              details={assessment.colorQuality.details}
              icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <QualityMetric 
              label="조명" 
              score={assessment.lighting.score} 
              details={assessment.lighting.details}
              icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
            />
            
            <QualityMetric 
              label="압축" 
              score={assessment.compression.score} 
              details={`압축 수준: ${assessment.compression.level === 'low' 
                ? '낮음' 
                : assessment.compression.level === 'medium' 
                  ? '중간' 
                  : '높음'}`}
              icon={<Info className="h-3.5 w-3.5 text-blue-500" />}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageQualityAssessmentDisplay; 