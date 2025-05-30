/**
 * 스타일 가이드 관리 API 라우트
 * 스타일 가이드 생성, 조회, 수정, 삭제 기능을 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  generateStyleGuide, 
  saveStyleGuide,
  getStyleGuideById,
  getStyleGuidesByProject,
  updateStyleGuide,
  deleteStyleGuide,
  getPublicStyleGuides,
  searchStyleGuidesByTags,
  exportStyleGuideAsJson
} from '@/lib/services/styleGuideService';
import { getStyleAnalysisById } from '@/lib/services/styleAnalysisService';
import { analyzeStyleWithAI } from '@/lib/services/aiStyleAnalysisService';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET 요청 처리 - 스타일 가이드 조회
 * @param request NextRequest 객체
 * @returns API 응답
 */
export async function GET(request: NextRequest) {
  try {
    // 세션 확인 (인증 필요)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const projectId = searchParams.get('projectId');
    const publicOnly = searchParams.get('public') === 'true';
    const tags = searchParams.get('tags');
    const format = searchParams.get('format');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // 단일 스타일 가이드 조회
    if (id) {
      const styleGuide = await getStyleGuideById(id);
      
      // JSON 포맷으로 내보내기 요청 시
      if (format === 'json') {
        const jsonData = await exportStyleGuideAsJson(id);
        return new NextResponse(jsonData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="style-guide-${id}.json"`,
          },
        });
      }
      
      return NextResponse.json({ styleGuide });
    }
    
    // 프로젝트별 스타일 가이드 목록 조회
    if (projectId) {
      const styleGuides = await getStyleGuidesByProject(projectId);
      return NextResponse.json({ styleGuides });
    }
    
    // 태그 기반 검색
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      const styleGuides = await searchStyleGuidesByTags(tagArray, limit);
      return NextResponse.json({ styleGuides });
    }
    
    // 공개 스타일 가이드 목록 조회
    if (publicOnly) {
      const styleGuides = await getPublicStyleGuides(limit, offset);
      return NextResponse.json({ styleGuides });
    }
    
    // 기본: 간단한 응답 반환
    return NextResponse.json({ message: '스타일 가이드 API 엔드포인트' });
  } catch (error) {
    console.error('스타일 가이드 조회 API 오류:', error);
    
    return NextResponse.json(
      { error: `스타일 가이드 조회 중 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * POST 요청 처리 - 스타일 가이드 생성
 * @param request NextRequest 객체
 * @returns API 응답
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 확인 (인증 필요)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.analysisId) {
      return NextResponse.json(
        { error: '스타일 분석 ID는 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 스타일 분석 결과 조회
    const analysis = await getStyleAnalysisById(body.analysisId);
    
    // AI 분석 수행 (또는 기존 분석 사용)
    let aiAnalysis;
    if (body.useAiAnalysis !== false) {
      // AI 분석 옵션 설정
      const aiOptions = {
        useCache: body.useCache !== false,
        detailLevel: body.detailLevel || 'detailed',
        focus: body.focus || 'general'
      };
      
      // AI 분석 수행
      aiAnalysis = await analyzeStyleWithAI(analysis.rawData, aiOptions);
    } else if (body.aiAnalysis) {
      // 클라이언트에서 제공한 AI 분석 결과 사용
      aiAnalysis = body.aiAnalysis;
    } else {
      return NextResponse.json(
        { error: 'AI 분석 결과가 필요합니다. useAiAnalysis를 true로 설정하거나 aiAnalysis 객체를 제공하세요.' },
        { status: 400 }
      );
    }
    
    // 스타일 가이드 생성 옵션
    const guideOptions = {
      title: body.title,
      description: body.description,
      isPublic: body.isPublic || false,
      tags: body.tags || []
    };
    
    // 스타일 가이드 생성
    const styleGuide = generateStyleGuide(analysis, aiAnalysis, guideOptions);
    
    // 데이터베이스에 저장
    const guideId = await saveStyleGuide(styleGuide);
    
    // 생성된 가이드 ID와 함께 응답
    return NextResponse.json({
      message: '스타일 가이드가 성공적으로 생성되었습니다.',
      guideId,
    });
  } catch (error) {
    console.error('스타일 가이드 생성 API 오류:', error);
    
    return NextResponse.json(
      { error: `스타일 가이드 생성 중 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH 요청 처리 - 스타일 가이드 업데이트
 * @param request NextRequest 객체
 * @returns API 응답
 */
export async function PATCH(request: NextRequest) {
  try {
    // 세션 확인 (인증 필요)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 필수 필드 검증
    if (!body.id) {
      return NextResponse.json(
        { error: '업데이트할 스타일 가이드 ID는 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 업데이트 수행
    const success = await updateStyleGuide(body.id, body);
    
    if (success) {
      return NextResponse.json({
        message: '스타일 가이드가 성공적으로 업데이트되었습니다.',
      });
    } else {
      return NextResponse.json(
        { error: '스타일 가이드 업데이트에 실패했습니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('스타일 가이드 업데이트 API 오류:', error);
    
    return NextResponse.json(
      { error: `스타일 가이드 업데이트 중 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

/**
 * DELETE 요청 처리 - 스타일 가이드 삭제
 * @param request NextRequest 객체
 * @returns API 응답
 */
export async function DELETE(request: NextRequest) {
  try {
    // 세션 확인 (인증 필요)
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }
    
    // URL 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    // ID 검증
    if (!id) {
      return NextResponse.json(
        { error: '삭제할 스타일 가이드 ID는 필수입니다.' },
        { status: 400 }
      );
    }
    
    // 삭제 수행
    const success = await deleteStyleGuide(id);
    
    if (success) {
      return NextResponse.json({
        message: '스타일 가이드가 성공적으로 삭제되었습니다.',
      });
    } else {
      return NextResponse.json(
        { error: '스타일 가이드 삭제에 실패했습니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('스타일 가이드 삭제 API 오류:', error);
    
    return NextResponse.json(
      { error: `스타일 가이드 삭제 중 오류가 발생했습니다: ${(error as Error).message}` },
      { status: 500 }
    );
  }
} 