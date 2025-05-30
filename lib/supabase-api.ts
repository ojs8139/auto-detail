import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from './supabase';
import {
  TableName,
  ProjectRecord,
  AssetRecord,
  ContentRecord,
  Project,
  Asset,
  Content
} from './types';

// 데이터 변환 유틸리티 함수
const mapProjectFromRecord = (record: ProjectRecord): Project => {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    status: record.status === 'active'
  };
};

const mapAssetFromRecord = (record: AssetRecord): Asset => {
  return {
    id: record.id,
    projectId: record.project_id,
    name: record.name,
    type: record.type as 'image' | 'text' | 'url',
    content: record.content,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    metadata: record.metadata
  };
};

const mapContentFromRecord = (record: ContentRecord): Content => {
  return {
    id: record.id,
    projectId: record.project_id,
    name: record.name,
    html: record.html_content,
    markdown: record.markdown_content || '',
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    assets: record.assets || [],
    metadata: record.metadata
  };
};

// 프로젝트 관련 API 함수
export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const newProject = {
    id: uuidv4(),
    name: project.name,
    description: project.description,
    status: project.status ? 'active' : 'archived',
    settings: project.settings
  };

  const { data, error } = await supabase
    .from(TableName.PROJECTS)
    .insert(newProject)
    .select()
    .single();

  if (error) {
    console.error('프로젝트 생성 오류:', error);
    return null;
  }

  return mapProjectFromRecord(data);
};

export const getProjects = async (): Promise<Project[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TableName.PROJECTS)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('프로젝트 조회 오류:', error);
    return [];
  }

  return data.map(mapProjectFromRecord);
};

export const getProject = async (id: string): Promise<Project | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TableName.PROJECTS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`프로젝트 조회 오류 (ID: ${id}):`, error);
    return null;
  }

  return mapProjectFromRecord(data);
};

export const updateProject = async (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Project | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.status !== undefined) updateData.status = updates.status ? 'active' : 'archived';
  if (updates.settings !== undefined) updateData.settings = updates.settings;

  const { data, error } = await supabase
    .from(TableName.PROJECTS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`프로젝트 업데이트 오류 (ID: ${id}):`, error);
    return null;
  }

  return mapProjectFromRecord(data);
};

export const deleteProject = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from(TableName.PROJECTS)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`프로젝트 삭제 오류 (ID: ${id}):`, error);
    return false;
  }

  return true;
};

// 에셋 관련 API 함수
export const createAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const newAsset = {
    id: uuidv4(),
    project_id: asset.projectId,
    name: asset.name,
    type: asset.type,
    content: asset.content,
    metadata: asset.metadata
  };

  const { data, error } = await supabase
    .from(TableName.ASSETS)
    .insert(newAsset)
    .select()
    .single();

  if (error) {
    console.error('에셋 생성 오류:', error);
    return null;
  }

  return mapAssetFromRecord(data);
};

export const getProjectAssets = async (projectId: string): Promise<Asset[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TableName.ASSETS)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`프로젝트 에셋 조회 오류 (프로젝트 ID: ${projectId}):`, error);
    return [];
  }

  return data.map(mapAssetFromRecord);
};

export const getAsset = async (id: string): Promise<Asset | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TableName.ASSETS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`에셋 조회 오류 (ID: ${id}):`, error);
    return null;
  }

  return mapAssetFromRecord(data);
};

export const updateAsset = async (id: string, updates: Partial<Omit<Asset, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Promise<Asset | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

  const { data, error } = await supabase
    .from(TableName.ASSETS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`에셋 업데이트 오류 (ID: ${id}):`, error);
    return null;
  }

  return mapAssetFromRecord(data);
};

export const deleteAsset = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from(TableName.ASSETS)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`에셋 삭제 오류 (ID: ${id}):`, error);
    return false;
  }

  return true;
};

// 콘텐츠 관련 API 함수
export const createContent = async (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<Content | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const newContent = {
    id: uuidv4(),
    project_id: content.projectId,
    name: content.name,
    html_content: content.html,
    markdown_content: content.markdown,
    assets: content.assets,
    metadata: content.metadata
  };

  const { data, error } = await supabase
    .from(TableName.CONTENTS)
    .insert(newContent)
    .select()
    .single();

  if (error) {
    console.error('콘텐츠 생성 오류:', error);
    return null;
  }

  return mapContentFromRecord(data);
};

export const getProjectContents = async (projectId: string): Promise<Content[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from(TableName.CONTENTS)
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`프로젝트 콘텐츠 조회 오류 (프로젝트 ID: ${projectId}):`, error);
    return [];
  }

  return data.map(mapContentFromRecord);
};

export const getContent = async (id: string): Promise<Content | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TableName.CONTENTS)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`콘텐츠 조회 오류 (ID: ${id}):`, error);
    return null;
  }

  return mapContentFromRecord(data);
};

export const updateContent = async (id: string, updates: Partial<Omit<Content, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Promise<Content | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.html !== undefined) updateData.html_content = updates.html;
  if (updates.markdown !== undefined) updateData.markdown_content = updates.markdown;
  if (updates.assets !== undefined) updateData.assets = updates.assets;
  if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

  const { data, error } = await supabase
    .from(TableName.CONTENTS)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`콘텐츠 업데이트 오류 (ID: ${id}):`, error);
    return null;
  }

  return mapContentFromRecord(data);
};

export const deleteContent = async (id: string): Promise<boolean> => {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  const { error } = await supabase
    .from(TableName.CONTENTS)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`콘텐츠 삭제 오류 (ID: ${id}):`, error);
    return false;
  }

  return true;
}; 