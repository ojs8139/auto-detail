/**
 * 사용자 피드백 관리 서비스
 * 이미지 선택 및 매칭에 대한 사용자 피드백을 저장하고 활용하는 기능을 제공합니다.
 */

import { createClient } from '@vercel/kv';
import { PageSection } from './imageSectionMatchingService';

// KV 스토어 클라이언트 생성 (설정된 경우)
let kvClient: ReturnType<typeof createClient> | null = null;

try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kvClient = createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
} catch (error) {
  console.error('KV 클라이언트 생성 실패:', error);
  kvClient = null;
}

/**
 * 피드백 유형 정의
 */
export enum FeedbackType {
  QUALITY = 'quality',         // 이미지 품질에 관한 피드백
  RELEVANCE = 'relevance',     // 이미지 관련성에 관한 피드백
  DIVERSITY = 'diversity',     // 이미지 다양성에 관한 피드백
  SECTION_MATCH = 'section',   // 섹션 매칭에 관한 피드백
  LAYOUT = 'layout',           // 레이아웃 추천에 관한 피드백
  GENERAL = 'general'          // 일반적인 피드백
}

/**
 * 피드백 점수 정의
 */
export enum FeedbackScore {
  VERY_BAD = 1,      // 매우 나쁨
  BAD = 2,           // 나쁨
  NEUTRAL = 3,       // 보통
  GOOD = 4,          // 좋음
  VERY_GOOD = 5      // 매우 좋음
}

/**
 * 피드백 데이터 인터페이스
 */
export interface UserFeedback {
  id?: string;                    // 피드백 고유 ID
  projectId: string;              // 프로젝트 ID
  userId?: string;                // 사용자 ID (선택 사항)
  type: FeedbackType;             // 피드백 유형
  score: FeedbackScore;           // 피드백 점수 (1-5)
  comment?: string;               // 사용자 코멘트 (선택 사항)
  section?: PageSection;          // 관련 섹션 (섹션 매칭 피드백인 경우)
  imageUrls?: string[];           // 관련 이미지 URL (해당되는 경우)
  createdAt: Date;                // 생성 시간
  context?: Record<string, any>;  // 추가 컨텍스트 정보
}

/**
 * 피드백 저장 결과 인터페이스
 */
interface FeedbackResult {
  success: boolean;
  id?: string;
  message?: string;
  error?: string;
}

/**
 * 사용자 피드백 저장
 * 
 * @param feedback 저장할 피드백 데이터
 * @returns 저장 결과
 */
export async function saveFeedback(feedback: UserFeedback): Promise<FeedbackResult> {
  try {
    // 고유 ID 생성 (없는 경우)
    if (!feedback.id) {
      feedback.id = `feedback_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // 생성 시간 설정
    if (!feedback.createdAt) {
      feedback.createdAt = new Date();
    }
    
    // KV 스토어 사용 (설정된 경우)
    if (kvClient) {
      // 프로젝트별 피드백 목록에 추가
      const projectFeedbackKey = `feedback:project:${feedback.projectId}`;
      const existingFeedbacks = await kvClient.get<string[]>(projectFeedbackKey) || [];
      
      await kvClient.set(projectFeedbackKey, [...existingFeedbacks, feedback.id]);
      
      // 피드백 저장
      await kvClient.set(`feedback:${feedback.id}`, feedback);
      
      // 피드백 타입별 인덱스 업데이트
      const typeIndexKey = `feedback:type:${feedback.type}`;
      const typeIndex = await kvClient.get<string[]>(typeIndexKey) || [];
      
      await kvClient.set(typeIndexKey, [...typeIndex, feedback.id]);
      
      // 섹션별 인덱스 업데이트 (해당되는 경우)
      if (feedback.section) {
        const sectionIndexKey = `feedback:section:${feedback.section}`;
        const sectionIndex = await kvClient.get<string[]>(sectionIndexKey) || [];
        
        await kvClient.set(sectionIndexKey, [...sectionIndex, feedback.id]);
      }
      
      return {
        success: true,
        id: feedback.id,
        message: '피드백이 성공적으로 저장되었습니다.'
      };
    }
    
    // KV 스토어가 없는 경우 로컬 저장소 사용 (실제 구현에서는 다른 스토리지 옵션 사용)
    const feedbacks = getFeedbacksFromLocalStorage();
    feedbacks.push(feedback);
    saveFeedbacksToLocalStorage(feedbacks);
    
    return {
      success: true,
      id: feedback.id,
      message: '피드백이 로컬 스토리지에 저장되었습니다.'
    };
    
  } catch (error) {
    console.error('피드백 저장 중 오류 발생:', error);
    
    return {
      success: false,
      error: '피드백 저장에 실패했습니다.'
    };
  }
}

/**
 * 프로젝트별 피드백 조회
 * 
 * @param projectId 프로젝트 ID
 * @returns 피드백 목록
 */
export async function getFeedbacksByProject(projectId: string): Promise<UserFeedback[]> {
  try {
    // KV 스토어 사용 (설정된 경우)
    if (kvClient) {
      const projectFeedbackKey = `feedback:project:${projectId}`;
      const feedbackIds = await kvClient.get<string[]>(projectFeedbackKey) || [];
      
      if (feedbackIds.length === 0) {
        return [];
      }
      
      // 피드백 데이터 조회
      const feedbacks: UserFeedback[] = [];
      
      for (const id of feedbackIds) {
        const feedback = await kvClient.get<UserFeedback>(`feedback:${id}`);
        if (feedback) {
          feedbacks.push(feedback);
        }
      }
      
      return feedbacks;
    }
    
    // KV 스토어가 없는 경우 로컬 저장소에서 조회
    const allFeedbacks = getFeedbacksFromLocalStorage();
    return allFeedbacks.filter(feedback => feedback.projectId === projectId);
    
  } catch (error) {
    console.error('프로젝트별 피드백 조회 중 오류 발생:', error);
    return [];
  }
}

/**
 * 섹션별 피드백 조회
 * 
 * @param section 페이지 섹션
 * @param projectId 프로젝트 ID (선택 사항)
 * @returns 피드백 목록
 */
export async function getFeedbacksBySection(
  section: PageSection,
  projectId?: string
): Promise<UserFeedback[]> {
  try {
    // KV 스토어 사용 (설정된 경우)
    if (kvClient) {
      const sectionIndexKey = `feedback:section:${section}`;
      const feedbackIds = await kvClient.get<string[]>(sectionIndexKey) || [];
      
      if (feedbackIds.length === 0) {
        return [];
      }
      
      // 피드백 데이터 조회
      const feedbacks: UserFeedback[] = [];
      
      for (const id of feedbackIds) {
        const feedback = await kvClient.get<UserFeedback>(`feedback:${id}`);
        
        // 프로젝트 ID 필터링 (지정된 경우)
        if (feedback && (!projectId || feedback.projectId === projectId)) {
          feedbacks.push(feedback);
        }
      }
      
      return feedbacks;
    }
    
    // KV 스토어가 없는 경우 로컬 저장소에서 조회
    const allFeedbacks = getFeedbacksFromLocalStorage();
    return allFeedbacks.filter(feedback => 
      feedback.section === section && 
      (!projectId || feedback.projectId === projectId)
    );
    
  } catch (error) {
    console.error('섹션별 피드백 조회 중 오류 발생:', error);
    return [];
  }
}

/**
 * 피드백 점수 평균 계산
 * 
 * @param feedbacks 피드백 목록
 * @returns 평균 점수 (1-5)
 */
export function calculateAverageFeedbackScore(feedbacks: UserFeedback[]): number {
  if (feedbacks.length === 0) {
    return 0;
  }
  
  const sum = feedbacks.reduce((total, feedback) => total + feedback.score, 0);
  return sum / feedbacks.length;
}

/**
 * 피드백 통계 정보 계산
 * 
 * @param projectId 프로젝트 ID
 * @returns 피드백 통계 정보
 */
export async function calculateFeedbackStats(
  projectId: string
): Promise<Record<FeedbackType, { average: number; count: number }>> {
  const feedbacks = await getFeedbacksByProject(projectId);
  
  // 초기 통계 객체 생성
  const stats = Object.values(FeedbackType).reduce((result, type) => {
    result[type] = { average: 0, count: 0 };
    return result;
  }, {} as Record<FeedbackType, { average: number; count: number }>);
  
  // 피드백 없는 경우 초기값 반환
  if (feedbacks.length === 0) {
    return stats;
  }
  
  // 타입별 피드백 그룹화
  Object.values(FeedbackType).forEach(type => {
    const typeFeedbacks = feedbacks.filter(f => f.type === type);
    
    if (typeFeedbacks.length > 0) {
      stats[type] = {
        average: calculateAverageFeedbackScore(typeFeedbacks),
        count: typeFeedbacks.length
      };
    }
  });
  
  return stats;
}

/**
 * 로컬 스토리지에서 피드백 목록 조회
 * 클라이언트 측에서만 작동하는 임시 솔루션
 * 
 * @returns 저장된 피드백 목록
 */
function getFeedbacksFromLocalStorage(): UserFeedback[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const storedData = localStorage.getItem('userFeedbacks');
    return storedData ? JSON.parse(storedData) : [];
  } catch (error) {
    console.error('로컬 스토리지에서 피드백 조회 실패:', error);
    return [];
  }
}

/**
 * 로컬 스토리지에 피드백 목록 저장
 * 클라이언트 측에서만 작동하는 임시 솔루션
 * 
 * @param feedbacks 저장할 피드백 목록
 */
function saveFeedbacksToLocalStorage(feedbacks: UserFeedback[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('userFeedbacks', JSON.stringify(feedbacks));
  } catch (error) {
    console.error('로컬 스토리지에 피드백 저장 실패:', error);
  }
}

/**
 * 가장 많이 선택된 이미지 조회
 * 사용자들이 많이 선택한 이미지를 찾는 데 사용
 * 
 * @param projectId 프로젝트 ID
 * @param limit 조회할 최대 개수
 * @returns 가장 많이 선택된 이미지 URL과 카운트
 */
export async function getMostSelectedImages(
  projectId: string,
  limit = 5
): Promise<{ imageUrl: string; count: number }[]> {
  try {
    const feedbacks = await getFeedbacksByProject(projectId);
    
    // 이미지 URL이 있는 피드백만 필터링
    const feedbacksWithImages = feedbacks.filter(f => f.imageUrls && f.imageUrls.length > 0);
    
    // 이미지 URL별 카운트 집계
    const imageCounts: Record<string, number> = {};
    
    feedbacksWithImages.forEach(feedback => {
      feedback.imageUrls?.forEach(url => {
        imageCounts[url] = (imageCounts[url] || 0) + 1;
      });
    });
    
    // 많이 선택된 순서로 정렬
    const sortedImages = Object.entries(imageCounts)
      .map(([imageUrl, count]) => ({ imageUrl, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    return sortedImages;
    
  } catch (error) {
    console.error('가장 많이 선택된 이미지 조회 중 오류 발생:', error);
    return [];
  }
}

/**
 * 섹션별 추천 이미지 조회
 * 사용자 피드백을 기반으로 각 섹션에 적합한 이미지 추천
 * 
 * @param projectId 프로젝트 ID
 * @returns 섹션별 추천 이미지 URL
 */
export async function getRecommendedImagesBySection(
  projectId: string
): Promise<Record<PageSection, string[]>> {
  const result = Object.values(PageSection).reduce((acc, section) => {
    acc[section] = [];
    return acc;
  }, {} as Record<PageSection, string[]>);
  
  try {
    // 섹션별 피드백 조회
    for (const section of Object.values(PageSection)) {
      const sectionFeedbacks = await getFeedbacksBySection(section, projectId);
      
      // 긍정적인 피드백만 필터링 (점수 4 이상)
      const positiveFeedbacks = sectionFeedbacks.filter(f => f.score >= FeedbackScore.GOOD);
      
      // 이미지 URL 빈도 계산
      const imageFrequency: Record<string, number> = {};
      
      positiveFeedbacks.forEach(feedback => {
        feedback.imageUrls?.forEach(url => {
          imageFrequency[url] = (imageFrequency[url] || 0) + feedback.score;
        });
      });
      
      // 점수 기준으로 정렬
      const sortedImages = Object.entries(imageFrequency)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .map(([url]) => url)
        .slice(0, 3); // 상위 3개 이미지 선택
      
      result[section] = sortedImages;
    }
    
    return result;
    
  } catch (error) {
    console.error('섹션별 추천 이미지 조회 중 오류 발생:', error);
    return result;
  }
}

/**
 * 피드백 저장 이력 조회 (사용자 & 프로젝트별)
 * 
 * @param userId 사용자 ID
 * @param projectId 프로젝트 ID
 * @returns 피드백 저장 여부
 */
export async function hasFeedback(userId: string, projectId: string): Promise<boolean> {
  try {
    if (kvClient) {
      const projectFeedbacks = await getFeedbacksByProject(projectId);
      return projectFeedbacks.some(f => f.userId === userId);
    }
    
    const localFeedbacks = getFeedbacksFromLocalStorage();
    return localFeedbacks.some(f => f.userId === userId && f.projectId === projectId);
    
  } catch (error) {
    console.error('피드백 이력 조회 중 오류 발생:', error);
    return false;
  }
} 