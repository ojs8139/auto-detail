"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { FeedbackType, FeedbackScore } from '@/lib/services/userFeedbackService';
import { PageSection } from '@/lib/services/imageSectionMatchingService';

// 폼 스키마 정의
const feedbackFormSchema = z.object({
  type: z.nativeEnum(FeedbackType),
  score: z.nativeEnum(FeedbackScore),
  comment: z.string().optional(),
  section: z.nativeEnum(PageSection).optional(),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

// 피드백 유형 정보
const FEEDBACK_TYPES = [
  { value: FeedbackType.QUALITY, label: '이미지 품질', description: '이미지 해상도, 선명도, 노이즈 등의 품질' },
  { value: FeedbackType.RELEVANCE, label: '이미지 관련성', description: '이미지가 제품이나 주제와 얼마나 관련 있는지' },
  { value: FeedbackType.DIVERSITY, label: '이미지 다양성', description: '선택된 이미지들의 다양성과 균형' },
  { value: FeedbackType.SECTION_MATCH, label: '섹션 매칭', description: '이미지가 각 섹션에 적절하게 배치되었는지' },
  { value: FeedbackType.LAYOUT, label: '레이아웃 추천', description: '추천된 레이아웃의 적절성' },
  { value: FeedbackType.GENERAL, label: '전반적인 평가', description: '전체적인 이미지 선택 및 배치에 대한 평가' },
];

// 피드백 점수 정보
const FEEDBACK_SCORES = [
  { value: FeedbackScore.VERY_BAD, label: '매우 나쁨' },
  { value: FeedbackScore.BAD, label: '나쁨' },
  { value: FeedbackScore.NEUTRAL, label: '보통' },
  { value: FeedbackScore.GOOD, label: '좋음' },
  { value: FeedbackScore.VERY_GOOD, label: '매우 좋음' },
];

// 컴포넌트 props 정의
interface FeedbackFormProps {
  projectId: string;
  userId?: string;
  onFeedbackSubmit?: (success: boolean) => void;
  selectedImages?: string[];
  initialType?: FeedbackType;
  initialSection?: PageSection;
}

export default function FeedbackForm({
  projectId,
  userId,
  onFeedbackSubmit,
  selectedImages = [],
  initialType = FeedbackType.GENERAL,
  initialSection,
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 폼 초기 설정
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: initialType,
      score: FeedbackScore.NEUTRAL,
      comment: '',
      section: initialSection,
    },
  });
  
  // 현재 선택된 피드백 유형
  const selectedType = form.watch('type');
  
  // 섹션 입력 필요 여부
  const needsSection = selectedType === FeedbackType.SECTION_MATCH;
  
  // 폼 제출 처리
  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    
    try {
      // API 요청 데이터 준비
      const feedbackData = {
        ...data,
        projectId,
        userId,
        imageUrls: selectedImages,
      };
      
      // API 요청
      const response = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '피드백 제출 중 오류가 발생했습니다.');
      }
      
      const result = await response.json();
      
      // 성공 메시지 표시
      toast({
        title: '피드백 제출 완료',
        description: '소중한 의견을 보내주셔서 감사합니다. 더 나은 서비스를 제공하는데 활용하겠습니다.',
      });
      
      // 폼 초기화
      form.reset({
        type: initialType,
        score: FeedbackScore.NEUTRAL,
        comment: '',
        section: initialSection,
      });
      
      // 콜백 호출
      if (onFeedbackSubmit) {
        onFeedbackSubmit(true);
      }
      
    } catch (error) {
      console.error('피드백 제출 오류:', error);
      
      toast({
        title: '피드백 제출 실패',
        description: error instanceof Error ? error.message : '피드백 제출 중 오류가 발생했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
      
      // 콜백 호출
      if (onFeedbackSubmit) {
        onFeedbackSubmit(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">이미지 선택 피드백</h3>
          <p className="text-sm text-muted-foreground">
            이미지 선택 알고리즘에 대한 피드백을 남겨주세요. 
            여러분의 소중한 의견은 서비스 개선에 큰 도움이 됩니다.
          </p>
        </div>
        
        {/* 피드백 유형 선택 */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>피드백 유형</FormLabel>
              <Select
                disabled={isSubmitting}
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="피드백 유형을 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FEEDBACK_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                {FEEDBACK_TYPES.find(t => t.value === field.value)?.description}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 섹션 매칭 피드백인 경우 섹션 선택 표시 */}
        {needsSection && (
          <FormField
            control={form.control}
            name="section"
            render={({ field }) => (
              <FormItem>
                <FormLabel>페이지 섹션</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="피드백을 남길 페이지 섹션을 선택하세요" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PageSection).map((section) => (
                      <SelectItem key={section} value={section}>
                        {section.charAt(0).toUpperCase() + section.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  해당 섹션의 이미지 매칭에 대한 피드백을 남겨주세요.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* 피드백 점수 선택 */}
        <FormField
          control={form.control}
          name="score"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>평가 점수</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) => field.onChange(Number(value))}
                  defaultValue={field.value.toString()}
                  className="flex flex-col space-y-1"
                >
                  {FEEDBACK_SCORES.map((score) => (
                    <FormItem
                      key={score.value}
                      className="flex items-center space-x-3 space-y-0"
                    >
                      <FormControl>
                        <RadioGroupItem 
                          value={score.value.toString()} 
                          disabled={isSubmitting} 
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {score.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 상세 코멘트 */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>상세 의견 (선택사항)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="개선을 위한 구체적인 의견이나 제안을 남겨주세요."
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                이미지 선택 알고리즘 개선을 위한 구체적인 의견이나 제안을 남겨주세요.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* 이미지 선택 정보 표시 */}
        {selectedImages.length > 0 && (
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">
              선택된 이미지 ({selectedImages.length}개)
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((imageUrl, index) => (
                <div key={index} className="relative w-12 h-12 rounded overflow-hidden">
                  <img src={imageUrl} alt={`피드백 이미지 ${index + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 제출 버튼 */}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '제출 중...' : '피드백 제출'}
        </Button>
      </form>
    </Form>
  );
} 