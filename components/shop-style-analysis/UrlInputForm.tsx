/**
 * 쇼핑몰 URL 입력 폼 컴포넌트
 * 사용자로부터 분석할 쇼핑몰 URL을 입력받습니다.
 */

'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// 폼 검증 스키마
const formSchema = z.object({
  url: z.string()
    .url({ message: '유효한 URL을 입력해주세요.' })
    .refine((url) => {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    }, { message: '유효한 URL 형식이 아닙니다.' })
});

// 컴포넌트 속성 정의
export interface UrlInputFormProps {
  onAnalyze: (url: string) => Promise<void>;
  isAnalyzing: boolean;
}

/**
 * 쇼핑몰 URL 입력 폼 컴포넌트
 */
export function UrlInputForm({ onAnalyze, isAnalyzing }: UrlInputFormProps) {
  const { toast } = useToast();
  
  // 폼 상태 관리
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: '',
    },
  });
  
  // 폼 제출 처리
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await onAnalyze(values.url);
    } catch (error) {
      toast({
        title: '분석 실패',
        description: `쇼핑몰 스타일 분석 중 오류가 발생했습니다: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>쇼핑몰 URL</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com" 
                    {...field}
                    disabled={isAnalyzing}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      '분석하기'
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="text-sm text-muted-foreground">
          분석할 쇼핑몰의 URL을 입력해주세요. 스타일, 색상, 폰트 등을 분석하여 스타일 가이드를 생성합니다.
        </div>
      </form>
    </Form>
  );
} 