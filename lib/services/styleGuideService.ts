/**
 * 스타일 가이드 생성 및 저장 서비스
 * 분석된 쇼핑몰 스타일을 기반으로 스타일 가이드를 생성하고 저장하는 기능을 제공합니다.
 */

import { createClient } from '@/lib/supabase/client';
import { StyleAnalysisResult } from './styleAnalysisService';
import { DetailedStyleAnalysis } from './aiStyleAnalysisService';

// 스타일 가이드 인터페이스
export interface StyleGuide {
  id?: string;
  title: string;
  description?: string;
  projectId?: string;
  analysisId?: string;
  sourceUrl?: string;
  colorPalette: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    fontPairings: string[];
    styleDescription?: string;
  };
  designElements: {
    patterns: string[];
    shapes: string[];
    iconStyle?: string;
  };
  brandMood: {
    description: string;
    keywords: string[];
    targetAudience?: string;
  };
  recommendations?: {
    colorUsage?: string;
    typographyUsage?: string;
    imageStyle?: string;
    layoutSuggestions?: string;
  };
  tags?: string[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 스타일 분석 결과로부터 스타일 가이드를 생성합니다.
 * @param analysis 스타일 분석 결과
 * @param aiAnalysis AI 기반 상세 분석 결과
 * @param options 생성 옵션
 * @returns 생성된 스타일 가이드
 */
export const generateStyleGuide = (
  analysis: StyleAnalysisResult,
  aiAnalysis: DetailedStyleAnalysis,
  options: { title?: string; description?: string; isPublic?: boolean; tags?: string[] } = {}
): StyleGuide => {
  // 타이틀 생성 (없을 경우 분석된 사이트 제목 사용)
  const title = options.title || `스타일 가이드: ${analysis.metadata.title || '분석된 쇼핑몰'}`;
  
  // 설명 생성 (없을 경우 기본 설명 생성)
  const description = options.description || 
    `${analysis.metadata.title || '웹사이트'} 분석을 기반으로 생성된 스타일 가이드입니다. ${new Date().toLocaleDateString()} 생성됨.`;
  
  // AI 분석 결과와 기본 분석 결과를 통합하여 스타일 가이드 생성
  const styleGuide: StyleGuide = {
    title,
    description,
    projectId: analysis.projectId,
    analysisId: analysis.id,
    sourceUrl: analysis.url,
    colorPalette: aiAnalysis.colorPalette,
    typography: aiAnalysis.typography,
    designElements: aiAnalysis.designElements,
    brandMood: aiAnalysis.brandMood,
    recommendations: aiAnalysis.recommendations,
    tags: options.tags || [],
    isPublic: options.isPublic || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  return styleGuide;
};

/**
 * 스타일 가이드를 Supabase에 저장합니다.
 * @param styleGuide 저장할 스타일 가이드
 * @returns 저장된 스타일 가이드 ID
 */
export const saveStyleGuide = async (styleGuide: StyleGuide): Promise<string> => {
  try {
    const supabase = createClient();
    
    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('style_guides')
      .insert({
        title: styleGuide.title,
        description: styleGuide.description,
        project_id: styleGuide.projectId,
        analysis_id: styleGuide.analysisId,
        source_url: styleGuide.sourceUrl,
        color_palette: styleGuide.colorPalette,
        typography: styleGuide.typography,
        design_elements: styleGuide.designElements,
        brand_mood: styleGuide.brandMood,
        recommendations: styleGuide.recommendations,
        tags: styleGuide.tags,
        is_public: styleGuide.isPublic,
        created_at: styleGuide.createdAt,
        updated_at: styleGuide.updatedAt,
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('스타일 가이드 저장 실패:', error);
    throw new Error(`스타일 가이드 저장 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 프로젝트에 저장된 스타일 가이드 목록을 조회합니다.
 * @param projectId 프로젝트 ID
 * @returns 스타일 가이드 배열
 */
export const getStyleGuidesByProject = async (projectId: string): Promise<StyleGuide[]> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Supabase 데이터 형식을 StyleGuide 형식으로 변환
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      projectId: item.project_id,
      analysisId: item.analysis_id,
      sourceUrl: item.source_url,
      colorPalette: item.color_palette,
      typography: item.typography,
      designElements: item.design_elements,
      brandMood: item.brand_mood,
      recommendations: item.recommendations,
      tags: item.tags,
      isPublic: item.is_public,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('스타일 가이드 목록 조회 실패:', error);
    throw new Error(`스타일 가이드 목록 조회 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 특정 스타일 가이드를 ID로 조회합니다.
 * @param guideId 스타일 가이드 ID
 * @returns 스타일 가이드
 */
export const getStyleGuideById = async (guideId: string): Promise<StyleGuide> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('id', guideId)
      .single();
      
    if (error) throw error;
    
    // Supabase 데이터 형식을 StyleGuide 형식으로 변환
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      projectId: data.project_id,
      analysisId: data.analysis_id,
      sourceUrl: data.source_url,
      colorPalette: data.color_palette,
      typography: data.typography,
      designElements: data.design_elements,
      brandMood: data.brand_mood,
      recommendations: data.recommendations,
      tags: data.tags,
      isPublic: data.is_public,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('스타일 가이드 조회 실패:', error);
    throw new Error(`스타일 가이드 조회 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 스타일 가이드를 업데이트합니다.
 * @param guideId 업데이트할 스타일 가이드 ID
 * @param updates 업데이트할 필드와 값
 * @returns 성공 여부
 */
export const updateStyleGuide = async (guideId: string, updates: Partial<StyleGuide>): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    // 업데이트 객체 생성 (스네이크 케이스로 변환)
    const updateData: any = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.colorPalette) updateData.color_palette = updates.colorPalette;
    if (updates.typography) updateData.typography = updates.typography;
    if (updates.designElements) updateData.design_elements = updates.designElements;
    if (updates.brandMood) updateData.brand_mood = updates.brandMood;
    if (updates.recommendations) updateData.recommendations = updates.recommendations;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    
    // 항상 업데이트 시간 갱신
    updateData.updated_at = new Date().toISOString();
    
    const { error } = await supabase
      .from('style_guides')
      .update(updateData)
      .eq('id', guideId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('스타일 가이드 업데이트 실패:', error);
    throw new Error(`스타일 가이드 업데이트 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 스타일 가이드를 삭제합니다.
 * @param guideId 삭제할 스타일 가이드 ID
 * @returns 성공 여부
 */
export const deleteStyleGuide = async (guideId: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('style_guides')
      .delete()
      .eq('id', guideId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('스타일 가이드 삭제 실패:', error);
    throw new Error(`스타일 가이드 삭제 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 공개된 스타일 가이드 목록을 조회합니다.
 * @param limit 조회할 최대 개수
 * @param offset 조회 시작 위치
 * @returns 공개된 스타일 가이드 배열
 */
export const getPublicStyleGuides = async (limit = 10, offset = 0): Promise<StyleGuide[]> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) throw error;
    
    // Supabase 데이터 형식을 StyleGuide 형식으로 변환
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      projectId: item.project_id,
      analysisId: item.analysis_id,
      sourceUrl: item.source_url,
      colorPalette: item.color_palette,
      typography: item.typography,
      designElements: item.design_elements,
      brandMood: item.brand_mood,
      recommendations: item.recommendations,
      tags: item.tags,
      isPublic: item.is_public,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('공개 스타일 가이드 목록 조회 실패:', error);
    throw new Error(`공개 스타일 가이드 목록 조회 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 태그로 스타일 가이드를 검색합니다.
 * @param tags 검색할 태그 배열
 * @param limit 조회할 최대 개수
 * @returns 검색된 스타일 가이드 배열
 */
export const searchStyleGuidesByTags = async (tags: string[], limit = 10): Promise<StyleGuide[]> => {
  try {
    const supabase = createClient();
    
    // 태그 배열에 있는 모든 태그가 포함된 스타일 가이드 검색
    const { data, error } = await supabase
      .from('style_guides')
      .select('*')
      .contains('tags', tags)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    // Supabase 데이터 형식을 StyleGuide 형식으로 변환
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      projectId: item.project_id,
      analysisId: item.analysis_id,
      sourceUrl: item.source_url,
      colorPalette: item.color_palette,
      typography: item.typography,
      designElements: item.design_elements,
      brandMood: item.brand_mood,
      recommendations: item.recommendations,
      tags: item.tags,
      isPublic: item.is_public,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('태그로 스타일 가이드 검색 실패:', error);
    throw new Error(`태그로 스타일 가이드 검색 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 스타일 가이드 내보내기 (JSON 형식)
 * @param guideId 내보낼 스타일 가이드 ID
 * @returns JSON 형식의 스타일 가이드
 */
export const exportStyleGuideAsJson = async (guideId: string): Promise<string> => {
  try {
    const styleGuide = await getStyleGuideById(guideId);
    return JSON.stringify(styleGuide, null, 2);
  } catch (error) {
    console.error('스타일 가이드 내보내기 실패:', error);
    throw new Error(`스타일 가이드 내보내기 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
}; 