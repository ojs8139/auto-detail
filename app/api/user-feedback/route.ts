/**
 * 사용자 피드백 API 라우트
 * 이미지 선택과 매칭에 대한 사용자 피드백을 저장하고 조회하는 기능을 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  saveFeedback, 
  getFeedbacksByProject,
  calculateFeedbackStats,
  UserFeedback,
  FeedbackType,
  FeedbackScore
} from '@/lib/services/userFeedbackService';
import { PageSection } from '@/lib/services/imageSectionMatchingService';

/**
 * 사용자 피드백 저장 API 핸들러
 * 
 * @param req 요청 객체
 * @returns API 응답
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // 필수 필드 검증
    if (!body.projectId || !body.type || !body.score) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다. projectId, type, score는 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 피드백 유형 검증
    if (!Object.values(FeedbackType).includes(body.type)) {
      return NextResponse.json(
        { error: '유효하지 않은 피드백 유형입니다.' },
        { status: 400 }
      );
    }
    
    // 점수 검증
    const score = Number(body.score);
    if (isNaN(score) || score < 1 || score > 5) {
      return NextResponse.json(
        { error: '점수는 1~5 사이의 숫자여야 합니다.' },
        { status: 400 }
      );
    }
    
    // 섹션 검증 (지정된 경우)
    if (body.section && !Object.values(PageSection).includes(body.section)) {
      return NextResponse.json(
        { error: '유효하지 않은 페이지 섹션입니다.' },
        { status: 400 }
      );
    }
    
    // 피드백 데이터 생성
    const feedback: UserFeedback = {
      projectId: body.projectId,
      userId: body.userId,
      type: body.type,
      score: score as FeedbackScore,
      comment: body.comment,
      section: body.section,
      imageUrls: body.imageUrls,
      createdAt: new Date(),
      context: body.context
    };
    
    // 피드백 저장
    const result = await saveFeedback(feedback);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '피드백 저장에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      id: result.id,
      message: result.message
    });
    
  } catch (error) {
    console.error('피드백 저장 중 오류 발생:', error);
    
    return NextResponse.json(
      { error: '피드백 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 피드백 조회 API 핸들러
 * 
 * @param req 요청 객체
 * @returns API 응답
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const includeStats = url.searchParams.get('stats') === 'true';
    
    // 프로젝트 ID 검증
    if (!projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 피드백 조회
    const feedbacks = await getFeedbacksByProject(projectId);
    
    // 통계 정보 계산 (요청된 경우)
    let stats: Record<FeedbackType, { average: number; count: number }> | null = null;
    if (includeStats) {
      stats = await calculateFeedbackStats(projectId);
    }
    
    return NextResponse.json({
      feedbacks,
      stats,
      count: feedbacks.length
    });
    
  } catch (error) {
    console.error('피드백 조회 중 오류 발생:', error);
    
    return NextResponse.json(
      { error: '피드백 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 