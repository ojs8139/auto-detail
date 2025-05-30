// 프로젝트 타입
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: boolean; // true: active, false: archived
  settings?: Record<string, any>;
  styleGuide?: StyleGuide;
  images?: ImageAsset[];
}

// 스타일 가이드 타입 정의
export interface StyleGuide {
  colors: string[];
  typography?: {
    fontFamily?: string;
    headingStyle?: string;
    bodyStyle?: string;
  };
  layoutStyle?: string;
  brandElements?: string[];
  layout?: string;
  mainColor?: string;
  accentColor?: string;
  font?: string;
  fontSize?: string;
  imageSize?: string;
}

// 이미지 자산 타입 정의
export interface ImageAsset {
  id: string;
  projectId: string;
  url: string;
  path?: string; // 이미지 경로 (url과 호환성 유지)
  filename?: string;
  type?: 'product' | 'background' | 'lifestyle' | 'icon' | 'other';
  metadata?: Record<string, any>;
  favorite?: boolean;
  tags?: string[];
  size?: number;
  dimensions?: { width: number, height: number };
  createdAt?: string;
}

// 텍스트 콘텐츠 타입 정의
export interface TextContent {
  id: string;
  projectId: string;
  content: string;
  type: 'heading' | 'body' | 'bullet' | 'callout';
  position?: {
    x?: number;
    y?: number;
  };
}

// 에셋 타입
export interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: 'image' | 'text' | 'url';
  content: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

// 콘텐츠 타입
export interface Content {
  id: string;
  projectId: string;
  name: string;
  html: string;
  markdown: string;
  createdAt: string;
  updatedAt: string;
  assets: string[];
  metadata?: Record<string, any>;
}

// Supabase 테이블 이름
export enum TableName {
  PROJECTS = 'projects',
  ASSETS = 'assets',
  CONTENTS = 'contents',
}

// 프로젝트 데이터 타입 (Supabase 테이블 타입)
export interface ProjectRecord {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived' | 'deleted';
  settings?: Record<string, any>;
}

// 에셋 데이터 타입 (Supabase 테이블 타입)
export interface AssetRecord {
  id: string;
  project_id: string;
  name: string;
  type: 'image' | 'text' | 'url';
  content: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

// 생성된 콘텐츠 데이터 타입 (Supabase 테이블 타입)
export interface ContentRecord {
  id: string;
  project_id: string;
  name: string;
  html_content: string;
  markdown_content?: string;
  created_at: string;
  updated_at: string;
  assets?: string[]; // 관련 에셋 ID 목록
  metadata?: Record<string, any>;
}

// Supabase 테이블 스키마 타입
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: ProjectRecord;
        Insert: Omit<ProjectRecord, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<ProjectRecord, 'id' | 'created_at' | 'updated_at'>> & { updated_at?: string };
      };
      assets: {
        Row: AssetRecord;
        Insert: Omit<AssetRecord, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<AssetRecord, 'id' | 'created_at' | 'updated_at'>> & { updated_at?: string };
      };
      contents: {
        Row: ContentRecord;
        Insert: Omit<ContentRecord, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<ContentRecord, 'id' | 'created_at' | 'updated_at'>> & { updated_at?: string };
      };
    };
  };
} 