-- 프로젝트 테이블
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'deleted'
  settings JSONB
);

-- 에셋 테이블 (이미지, 텍스트 등)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'text', 'url'
  content TEXT NOT NULL, -- 파일 경로, 텍스트 내용, URL 등
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- 생성된 콘텐츠 테이블
CREATE TABLE IF NOT EXISTS contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  markdown_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assets JSONB, -- 관련 에셋 ID 배열
  metadata JSONB
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_contents_project_id ON contents(project_id);

-- RLS(Row Level Security) 설정
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;

-- 기본 정책: 인증된 사용자만 자신의 데이터에 접근 가능
CREATE POLICY "사용자는 자신의 프로젝트만 볼 수 있음" ON projects
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY "사용자는 자신의 프로젝트만 수정할 수 있음" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY "사용자는 자신의 프로젝트만 삭제할 수 있음" ON projects
  FOR DELETE USING (auth.uid() = user_id);
  
CREATE POLICY "사용자는 자신의 프로젝트에만 추가할 수 있음" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 에셋과 콘텐츠에 대한 정책은 프로젝트 소유자에 따라 접근 제어
CREATE POLICY "프로젝트 소유자만 에셋 접근 가능" ON assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = assets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "프로젝트 소유자만 콘텐츠 접근 가능" ON contents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = contents.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- 타임스탬프 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_assets_updated_at
BEFORE UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contents_updated_at
BEFORE UPDATE ON contents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at(); 