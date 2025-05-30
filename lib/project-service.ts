"use client";

import { Project, Asset, Content } from './types';
import * as LocalStorage from './storage';
import * as SupabaseAPI from './supabase-api';
import { hasSupabaseCredentials } from './supabase';

/**
 * 사용 가능한 스토리지 타입을 결정하는 함수
 * @returns 'supabase' 또는 'local'
 */
export const getStorageType = (): 'supabase' | 'local' => {
  return hasSupabaseCredentials() ? 'supabase' : 'local';
};

/**
 * 모든 프로젝트 가져오기
 */
export const getAllProjects = async (): Promise<Project[]> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.getProjects();
  } else {
    return await LocalStorage.getAllProjects();
  }
};

/**
 * 특정 프로젝트 가져오기
 */
export const getProject = async (id: string): Promise<Project | null> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.getProject(id);
  } else {
    return await LocalStorage.getProjectAsync(id);
  }
};

/**
 * 새 프로젝트 생성
 */
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.createProject(project);
  } else {
    return await LocalStorage.createProject(
      project.name, 
      project.description || ''
    );
  }
};

/**
 * 프로젝트 업데이트
 */
export const updateProject = async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project | null> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.updateProject(id, updates);
  } else {
    const project = await LocalStorage.getProjectAsync(id);
    if (!project) return null;
    
    return await LocalStorage.updateProject({
      ...project,
      ...updates
    });
  }
};

/**
 * 프로젝트 삭제
 */
export const deleteProject = async (id: string): Promise<boolean> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.deleteProject(id);
  } else {
    return await LocalStorage.deleteProject(id);
  }
};

/**
 * 프로젝트 에셋 가져오기
 */
export const getProjectAssets = async (projectId: string): Promise<Asset[]> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.getProjectAssets(projectId);
  } else {
    // 현재 로컬 스토리지 구현이 다른 형태로 되어 있으므로 필요한 변환 작업 수행
    // 여기에 로컬 스토리지에서 에셋을 가져오는 로직 구현 필요
    return [];
  }
};

/**
 * 프로젝트 콘텐츠 가져오기
 */
export const getProjectContents = async (projectId: string): Promise<Content[]> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.getProjectContents(projectId);
  } else {
    // 로컬 저장소의 GeneratedContent 형식을 Content 형식으로 변환
    const localContents = LocalStorage.getProjectContents(projectId);
    return localContents.map(localContent => ({
      id: localContent.id,
      projectId: localContent.projectId,
      name: localContent.name || '제목 없음',
      html: localContent.content,
      markdown: '',
      createdAt: localContent.createdAt,
      updatedAt: localContent.createdAt,
      assets: [],
      metadata: {}
    }));
  }
};

/**
 * 콘텐츠 생성
 */
export const createContent = async (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<Content | null> => {
  if (getStorageType() === 'supabase') {
    return await SupabaseAPI.createContent(content);
  } else {
    // 로컬 저장소에 맞게 변환하여 저장
    const localContent = LocalStorage.saveContent(
      content.projectId,
      content.html,
      content.name
    );

    // 저장된 로컬 콘텐츠를 Content 형식으로 변환하여 반환
    return {
      id: localContent.id,
      projectId: localContent.projectId,
      name: localContent.name || '제목 없음',
      html: localContent.content,
      markdown: content.markdown || '',
      createdAt: localContent.createdAt,
      updatedAt: localContent.createdAt,
      assets: content.assets || [],
      metadata: content.metadata || {}
    };
  }
};

/**
 * 스토리지 타입이 변경될 때 호출되는 함수
 * 주로 Supabase 설정이 변경된 후 호출하여 UI를 업데이트하는 용도
 */
export const onStorageTypeChange = (): void => {
  // 이벤트를 발생시키거나 필요한 상태 업데이트 작업 수행
  // 현재는 빈 구현으로 둠
}; 