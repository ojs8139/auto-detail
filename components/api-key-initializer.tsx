"use client";

import { useEffect } from 'react';
import { saveOpenAIApiKey, getOpenAIApiKey, testApiConnection } from '@/lib/openai';
import { useToast } from '@/components/ui/use-toast';

// API 키는 .env 또는 .env.local 파일에 OPENAI_API_KEY로 설정하세요
// 절대로 코드에 직접 API 키를 포함하지 마세요

export function ApiKeyInitializer() {
  const { toast } = useToast();

  useEffect(() => {
    const initApiKey = async () => {
      try {
        // 환경 변수에서 API 키 확인
        const envApiKey = process.env.OPENAI_API_KEY;
        
        if (!envApiKey) {
          console.log('환경 변수에 API 키가 설정되지 않았습니다.');
          return;
        }
        
        // 기존 API 키 확인
        const currentApiKey = getOpenAIApiKey();
        
        // 만약 키가 없거나 현재 키가 환경 변수의 키와 다르면 업데이트
        if (!currentApiKey || currentApiKey !== envApiKey) {
          // API 키 유효성 테스트
          const isValid = await testApiConnection(envApiKey);
          
          if (isValid) {
            // 유효한 경우 저장
            saveOpenAIApiKey(envApiKey);
            console.log('OpenAI API 키가 성공적으로 업데이트되었습니다.');
            
            // 토스트로 알림
            toast({
              title: "API 키 업데이트 완료",
              description: "OpenAI API 키가 성공적으로 업데이트되었습니다.",
              duration: 3000,
            });
          } else {
            console.error('환경 변수의 API 키가 유효하지 않습니다.');
            
            // 토스트로 오류 알림
            toast({
              title: "API 키 오류",
              description: "API 키가 유효하지 않습니다. 환경 변수 설정을 확인해주세요.",
              variant: "destructive",
              duration: 5000,
            });
          }
        } else {
          console.log('API 키가 이미 최신 상태입니다.');
        }
      } catch (error) {
        console.error('API 키 초기화 중 오류:', error);
      }
    };

    // API 키 초기화 실행
    initApiKey();
  }, [toast]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
} 