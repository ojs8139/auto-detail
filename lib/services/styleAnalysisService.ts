/**
 * 쇼핑몰 스타일 분석 서비스
 * 스크래핑된 데이터를 분석하고 스타일 가이드를 생성하는 기능을 제공합니다.
 */

import { createClient } from '@/lib/supabase/client';
import { scrapeSite } from '@/lib/scraper';

// 스타일 분석 결과의 타입 정의
export interface StyleAnalysisResult {
  id?: string;
  url: string;
  projectId?: string;
  metadata: {
    title: string;
    description: string;
    [key: string]: any;
  };
  styleGuide: {
    colors: string[];
    dominantColors?: string[];
    fonts: string[];
    imageStyle?: string;
    mood?: string;
    recommendation?: string;
    layout?: {
      hasHeader?: boolean;
      hasFooter?: boolean;
      hasNavigation?: boolean;
      hasSidebar?: boolean;
      layoutType?: string;
      gridSystem?: boolean;
      flexboxUsed?: boolean;
      [key: string]: any;
    };
    [key: string]: any;
  };
  images: string[];
  rawData?: any;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * URL로부터 쇼핑몰 스타일을 분석합니다.
 * @param url 분석할 쇼핑몰 URL
 * @param projectId 관련 프로젝트 ID (선택적)
 * @returns 스타일 분석 결과
 */
export const analyzeShopStyle = async (url: string, projectId?: string): Promise<StyleAnalysisResult> => {
  try {
    // 1. 웹사이트 스크래핑
    const scrapingResult = await scrapeSite(url);
    
    // 2. 기본 스타일 분석 결과 생성
    const styleAnalysis: StyleAnalysisResult = {
      url,
      projectId,
      metadata: scrapingResult.metadata,
      styleGuide: {
        colors: scrapingResult.colors,
        fonts: scrapingResult.fonts,
      },
      images: scrapingResult.images.slice(0, 20), // 최대 20개 이미지만 저장
      rawData: scrapingResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 3. Supabase에 분석 결과 저장 (프로젝트 ID가 있는 경우)
    if (projectId) {
      await saveStyleAnalysis(styleAnalysis);
    }
    
    return styleAnalysis;
  } catch (error) {
    console.error('쇼핑몰 스타일 분석 실패:', error);
    throw new Error(`쇼핑몰 스타일 분석 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 스타일 분석 결과를 Supabase에 저장합니다.
 * @param analysis 저장할 스타일 분석 결과
 * @returns 저장된 분석 결과 ID
 */
export const saveStyleAnalysis = async (analysis: StyleAnalysisResult): Promise<string> => {
  try {
    const supabase = createClient();
    
    // 데이터베이스에 저장
    const { data, error } = await supabase
      .from('style_analyses')
      .insert({
        url: analysis.url,
        project_id: analysis.projectId,
        metadata: analysis.metadata,
        style_guide: analysis.styleGuide,
        images: analysis.images,
        raw_data: analysis.rawData,
        created_at: analysis.createdAt,
        updated_at: analysis.updatedAt,
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('스타일 분석 결과 저장 실패:', error);
    throw new Error(`스타일 분석 결과 저장 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 프로젝트에 저장된 스타일 분석 결과를 조회합니다.
 * @param projectId 프로젝트 ID
 * @returns 스타일 분석 결과 배열
 */
export const getStyleAnalysesByProject = async (projectId: string): Promise<StyleAnalysisResult[]> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('style_analyses')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Supabase 데이터 형식을 StyleAnalysisResult 형식으로 변환
    return data.map((item: any) => ({
      id: item.id,
      url: item.url,
      projectId: item.project_id,
      metadata: item.metadata,
      styleGuide: item.style_guide,
      images: item.images,
      rawData: item.raw_data,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error('스타일 분석 결과 조회 실패:', error);
    throw new Error(`스타일 분석 결과 조회 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 특정 스타일 분석 결과를 ID로 조회합니다.
 * @param analysisId 스타일 분석 ID
 * @returns 스타일 분석 결과
 */
export const getStyleAnalysisById = async (analysisId: string): Promise<StyleAnalysisResult> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('style_analyses')
      .select('*')
      .eq('id', analysisId)
      .single();
      
    if (error) throw error;
    
    // Supabase 데이터 형식을 StyleAnalysisResult 형식으로 변환
    return {
      id: data.id,
      url: data.url,
      projectId: data.project_id,
      metadata: data.metadata,
      styleGuide: data.style_guide,
      images: data.images,
      rawData: data.raw_data,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error('스타일 분석 결과 조회 실패:', error);
    throw new Error(`스타일 분석 결과 조회 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
};

/**
 * 스타일 분석 결과를 삭제합니다.
 * @param analysisId 삭제할 스타일 분석 ID
 * @returns 성공 여부
 */
export const deleteStyleAnalysis = async (analysisId: string): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('style_analyses')
      .delete()
      .eq('id', analysisId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('스타일 분석 결과 삭제 실패:', error);
    throw new Error(`스타일 분석 결과 삭제 중 오류가 발생했습니다: ${(error as Error).message}`);
  }
}; 