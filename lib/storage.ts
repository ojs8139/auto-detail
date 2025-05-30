"use client";

import { Project } from './types';
import { v4 as uuidv4 } from 'uuid';
import { 
  STORES, 
  addData, 
  updateData, 
  getAllData, 
  deleteData, 
  getData,
  migrateFromLocalStorage
} from './idb';

// 로컬 스토리지 키 (마이그레이션 및 폴백용)
const PROJECTS_KEY = 'detail-auto-create-projects';

// 초기 마이그레이션 (이 파일이 로드될 때 실행)
if (typeof window !== 'undefined') {
  (async function() {
    try {
      // 프로젝트 데이터 마이그레이션
      await migrateFromLocalStorage(PROJECTS_KEY, STORES.PROJECTS);
      console.log('프로젝트 데이터 마이그레이션 완료');
    } catch (error) {
      console.error('프로젝트 데이터 마이그레이션 오류:', error);
    }
  })();
}

/**
 * 생성된 콘텐츠 저장소 키
 */
const GENERATED_CONTENTS_KEY = 'detail-auto-create-contents';

/**
 * 생성된 콘텐츠 인터페이스
 */
export interface GeneratedContent {
  id: string;
  projectId: string;
  content: string;
  createdAt: string;
  name?: string;
}

/**
 * 로컬 스토리지에서 데이터를 가져오는 범용 함수
 * @param key 스토리지 키
 * @returns 저장된 데이터 또는 null
 */
export function getStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`[Storage] 데이터 불러오기 오류 (${key}):`, error);
    return null;
  }
}

/**
 * 로컬 스토리지에 데이터를 저장하는 범용 함수
 * @param key 스토리지 키
 * @param data 저장할 데이터
 */
export function setStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`[Storage] 데이터 저장 오류 (${key}):`, error);
  }
}

/**
 * 로컬 스토리지에서 데이터를 삭제하는 범용 함수
 * @param key 스토리지 키 (생략 시 모든 데이터 삭제)
 */
export function clearStorage(key?: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  } catch (error) {
    console.error(`[Storage] 데이터 삭제 오류${key ? ` (${key})` : ''}:`, error);
  }
}

/**
 * 고유 ID 생성
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * 모든 프로젝트 가져오기
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    // IndexedDB에서 모든 프로젝트 가져오기
    return await getAllData<Project>(STORES.PROJECTS);
  } catch (error) {
    console.error('프로젝트 불러오기 오류:', error);
    
    // 폴백: 로컬 스토리지에서 시도
    if (typeof window !== 'undefined') {
      try {
        const projects = localStorage.getItem(PROJECTS_KEY);
        return projects ? JSON.parse(projects) : [];
      } catch (e) {
        console.error('로컬 스토리지 폴백 오류:', e);
      }
    }
    
    return [];
  }
}

/**
 * 특정 프로젝트 가져오기
 */
export function getProject(id: string): Project | null {
  // 이 함수는 페이지 로드 시 동기적으로 호출되므로 로컬 스토리지를 먼저 확인
  if (typeof window !== 'undefined') {
    try {
      const projects = localStorage.getItem(PROJECTS_KEY);
      const allProjects = projects ? JSON.parse(projects) : [];
      return allProjects.find((project: Project) => project.id === id) || null;
    } catch (error) {
      console.error('프로젝트 가져오기 오류:', error);
    }
  }
  
  return null;
}

/**
 * 특정 프로젝트 가져오기 (비동기 버전)
 */
export async function getProjectAsync(id: string): Promise<Project | null> {
  try {
    // IndexedDB에서 프로젝트 가져오기
    return await getData<Project>(STORES.PROJECTS, id);
  } catch (error) {
    console.error('프로젝트 가져오기 오류:', error);
    
    // 폴백: 로컬 스토리지에서 가져오기
    const projects = getProjectsFromLocalStorage();
    return projects.find(p => p.id === id) || null;
  }
}

/**
 * 프로젝트 생성
 */
export async function createProject(name: string, description: string): Promise<Project> {
  const newProject: Project = {
    id: generateId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: true, // 기본값은 active
  };
  
  try {
    // IndexedDB에 프로젝트 저장
    await addData(STORES.PROJECTS, newProject);
    
    // 로컬 스토리지 백업 업데이트 (폴백용)
    updateProjectsLocalStorage(await getAllProjects());
    
    return newProject;
  } catch (error) {
    console.error('프로젝트 생성 오류:', error);
    
    // 폴백: 로컬 스토리지에 직접 저장
    const projects = await getAllProjects();
    projects.push(newProject);
    updateProjectsLocalStorage(projects);
    
    return newProject;
  }
}

/**
 * 프로젝트 업데이트
 */
export async function updateProject(project: Project): Promise<Project> {
  // 업데이트 시간 갱신
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  
  try {
    // IndexedDB에 프로젝트 업데이트
    await updateData(STORES.PROJECTS, updatedProject);
    
    // 로컬 스토리지 백업 업데이트 (폴백용)
    const projects = await getAllProjects();
    const updatedProjects = projects.map(p => 
      p.id === project.id ? updatedProject : p
    );
    updateProjectsLocalStorage(updatedProjects);
    
    return updatedProject;
  } catch (error) {
    console.error('프로젝트 업데이트 오류:', error);
    
    // 폴백: 로컬 스토리지에 직접 업데이트
    const projects = await getAllProjects();
    const updatedProjects = projects.map(p => 
      p.id === project.id ? updatedProject : p
    );
    updateProjectsLocalStorage(updatedProjects);
    
    return updatedProject;
  }
}

/**
 * 프로젝트 삭제
 */
export async function deleteProject(id: string): Promise<boolean> {
  try {
    // IndexedDB에서 프로젝트 삭제
    const success = await deleteData(STORES.PROJECTS, id);
    
    // 로컬 스토리지 백업 업데이트 (폴백용)
    if (success) {
      const projects = await getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== id);
      updateProjectsLocalStorage(filteredProjects);
    }
    
    return success;
  } catch (error) {
    console.error('프로젝트 삭제 오류:', error);
    
    // 폴백: 로컬 스토리지에서 직접 삭제
    if (typeof window !== 'undefined') {
      try {
        const projects = localStorage.getItem(PROJECTS_KEY);
        if (!projects) return false;
        
        const allProjects = JSON.parse(projects);
        const filteredProjects = allProjects.filter((project: Project) => project.id !== id);
        
        if (filteredProjects.length === allProjects.length) {
          return false;
        }
        
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(filteredProjects));
        return true;
      } catch (e) {
        console.error('로컬 스토리지 폴백 오류:', e);
      }
    }
    
    return false;
  }
}

/**
 * 로컬 스토리지 업데이트 (백업 및 폴백용)
 */
function updateProjectsLocalStorage(projects: Project[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('로컬 스토리지 업데이트 오류:', error);
    }
  }
}

/**
 * 프로젝트의 생성된 콘텐츠 목록 가져오기
 */
export function getProjectContents(projectId: string): GeneratedContent[] {
  const allContents = getAllContents();
  return allContents.filter((content: GeneratedContent) => content.projectId === projectId);
}

/**
 * 특정 생성된 콘텐츠 가져오기
 */
export function getContent(contentId: string): GeneratedContent | null {
  const allContents = getAllContents();
  return allContents.find((content: GeneratedContent) => content.id === contentId) || null;
}

/**
 * 생성된 콘텐츠 저장하기
 */
export function saveContent(projectId: string, content: string, name?: string): GeneratedContent {
  const contents = getAllContents();
  
  const newContent: GeneratedContent = {
    id: generateId(),
    projectId,
    content,
    createdAt: new Date().toISOString(),
    name: name || `콘텐츠 ${contents.filter(c => c.projectId === projectId).length + 1}`
  };
  
  contents.push(newContent);
  saveAllContents(contents);
  
  return newContent;
}

/**
 * 생성된 콘텐츠 업데이트
 */
export function updateContent(contentId: string, updates: Partial<GeneratedContent>): GeneratedContent | null {
  const contents = getAllContents();
  const contentIndex = contents.findIndex(content => content.id === contentId);
  
  if (contentIndex === -1) {
    return null;
  }
  
  const updatedContent = {
    ...contents[contentIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  contents[contentIndex] = updatedContent;
  saveAllContents(contents);
  
  return updatedContent;
}

/**
 * 생성된 콘텐츠 삭제
 */
export function deleteContent(contentId: string): boolean {
  const contents = getAllContents();
  const filteredContents = contents.filter(content => content.id !== contentId);
  
  if (filteredContents.length === contents.length) {
    return false;
  }
  
  saveAllContents(filteredContents);
  return true;
}

/**
 * 모든 생성된 콘텐츠 가져오기 (내부 함수)
 */
function getAllContents(): GeneratedContent[] {
  return getStorage<GeneratedContent[]>(GENERATED_CONTENTS_KEY) || [];
}

/**
 * 모든 생성된 콘텐츠 저장 (내부 함수)
 */
function saveAllContents(contents: GeneratedContent[]): void {
  setStorage(GENERATED_CONTENTS_KEY, contents);
}

/**
 * 로컬 스토리지에서 프로젝트 목록 가져오기
 * @returns 프로젝트 배열
 */
function getProjectsFromLocalStorage(): Project[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const projects = localStorage.getItem(PROJECTS_KEY);
    return projects ? JSON.parse(projects) : [];
  } catch (error) {
    console.error('로컬 스토리지에서 프로젝트 가져오기 오류:', error);
    return [];
  }
} 