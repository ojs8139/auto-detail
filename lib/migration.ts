import { v4 as uuidv4 } from 'uuid';
import { getProjects, createProject, getProjectAssets, createAsset, getProjectContents, createContent } from './supabase-api';
import { Project, Asset, Content } from './types';
import { getStorage, setStorage, clearStorage } from './storage';

/**
 * 로컬 스토리지에서 Supabase로 모든 데이터를 마이그레이션합니다.
 */
export const migrateAllData = async (): Promise<{
  success: boolean;
  message: string;
  stats: {
    projects: number;
    assets: number;
    contents: number;
  };
}> => {
  try {
    // 1. 로컬 스토리지에서 데이터 가져오기
    const projects = getStorage<Project[]>('projects') || [];
    
    if (projects.length === 0) {
      return {
        success: true,
        message: '마이그레이션할 데이터가 없습니다.',
        stats: { projects: 0, assets: 0, contents: 0 }
      };
    }
    
    // 2. 마이그레이션 결과 통계
    const stats = {
      projects: 0,
      assets: 0,
      contents: 0
    };
    
    // 3. 프로젝트 마이그레이션
    for (const project of projects) {
      // 프로젝트 생성
      const newProject = await createProject({
        name: project.name,
        description: project.description || '',
        status: project.status !== false, // 명시적으로 false인 경우에만 비활성 상태로 설정
        settings: project.settings
      });
      
      if (!newProject) continue;
      stats.projects++;
      
      // 프로젝트 ID 매핑 (로컬 ID → Supabase ID)
      const idMap = new Map<string, string>();
      idMap.set(project.id, newProject.id);
      
      // 4. 에셋 마이그레이션
      const assets = getStorage<Asset[]>(`assets_${project.id}`) || [];
      
      for (const asset of assets) {
        const newAsset = await createAsset({
          projectId: newProject.id,
          name: asset.name,
          type: asset.type,
          content: asset.content,
          metadata: asset.metadata
        });
        
        if (newAsset) {
          stats.assets++;
          idMap.set(asset.id, newAsset.id);
        }
      }
      
      // 5. 콘텐츠 마이그레이션
      const contents = getStorage<Content[]>(`contents_${project.id}`) || [];
      
      for (const content of contents) {
        // 에셋 ID 매핑 업데이트
        const mappedAssets = (content.assets || []).map((assetId: string) => {
          const mappedId = idMap.get(assetId);
          return mappedId || assetId;
        });
        
        const newContent = await createContent({
          projectId: newProject.id,
          name: content.name,
          html: content.html,
          markdown: content.markdown || '',
          assets: mappedAssets,
          metadata: content.metadata
        });
        
        if (newContent) {
          stats.contents++;
        }
      }
    }
    
    return {
      success: true,
      message: `마이그레이션 완료: ${stats.projects}개 프로젝트, ${stats.assets}개 에셋, ${stats.contents}개 콘텐츠가 마이그레이션되었습니다.`,
      stats
    };
  } catch (error) {
    console.error('마이그레이션 오류:', error);
    return {
      success: false,
      message: `마이그레이션 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      stats: { projects: 0, assets: 0, contents: 0 }
    };
  }
};

/**
 * Supabase에서 로컬 스토리지로 모든 데이터를 다운로드합니다.
 */
export const downloadAllData = async (): Promise<{
  success: boolean;
  message: string;
  stats: {
    projects: number;
    assets: number;
    contents: number;
  };
}> => {
  try {
    // 1. Supabase에서 데이터 가져오기
    const projects = await getProjects();
    
    if (projects.length === 0) {
      return {
        success: true,
        message: '다운로드할 데이터가 없습니다.',
        stats: { projects: 0, assets: 0, contents: 0 }
      };
    }
    
    // 2. 다운로드 결과 통계
    const stats = {
      projects: 0,
      assets: 0,
      contents: 0
    };
    
    // 3. 로컬 저장소에 프로젝트 저장
    setStorage('projects', projects);
    stats.projects = projects.length;
    
    // 4. 각 프로젝트의 에셋 및 콘텐츠 다운로드
    for (const project of projects) {
      // 에셋 다운로드
      const assets = await getProjectAssets(project.id);
      if (assets.length > 0) {
        setStorage(`assets_${project.id}`, assets);
        stats.assets += assets.length;
      }
      
      // 콘텐츠 다운로드
      const contents = await getProjectContents(project.id);
      if (contents.length > 0) {
        setStorage(`contents_${project.id}`, contents);
        stats.contents += contents.length;
      }
    }
    
    return {
      success: true,
      message: `다운로드 완료: ${stats.projects}개 프로젝트, ${stats.assets}개 에셋, ${stats.contents}개 콘텐츠가 다운로드되었습니다.`,
      stats
    };
  } catch (error) {
    console.error('다운로드 오류:', error);
    return {
      success: false,
      message: `다운로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      stats: { projects: 0, assets: 0, contents: 0 }
    };
  }
};

/**
 * 로컬 스토리지와 Supabase 데이터를 동기화합니다.
 * 로컬에만 있는 데이터는 Supabase로 업로드하고,
 * Supabase에만 있는 데이터는 로컬로 다운로드합니다.
 */
export const syncData = async (): Promise<{
  success: boolean;
  message: string;
  stats: {
    uploaded: { projects: number; assets: number; contents: number };
    downloaded: { projects: number; assets: number; contents: number };
  };
}> => {
  try {
    // 1. 로컬 및 Supabase 데이터 가져오기
    const localProjects = getStorage<Project[]>('projects') || [];
    const remoteProjects = await getProjects();
    
    // 2. 동기화 결과 통계
    const stats = {
      uploaded: { projects: 0, assets: 0, contents: 0 },
      downloaded: { projects: 0, assets: 0, contents: 0 }
    };
    
    // 3. 프로젝트 ID 기준으로 매핑
    const localProjectMap = new Map<string, Project>();
    localProjects.forEach(project => {
      localProjectMap.set(project.name, project); // 이름 기준으로 매핑 (ID는 다를 수 있음)
    });
    
    const remoteProjectMap = new Map<string, Project>();
    remoteProjects.forEach(project => {
      remoteProjectMap.set(project.name, project);
    });
    
    // 4. 로컬에만 있는 프로젝트 업로드
    for (const localProject of localProjects) {
      if (!remoteProjectMap.has(localProject.name)) {
        const newProject = await createProject({
          name: localProject.name,
          description: localProject.description || '',
          status: localProject.status !== false,
          settings: localProject.settings
        });
        
        if (newProject) {
          stats.uploaded.projects++;
          
          // 에셋 업로드
          const assets = getStorage<Asset[]>(`assets_${localProject.id}`) || [];
          for (const asset of assets) {
            const newAsset = await createAsset({
              projectId: newProject.id,
              name: asset.name,
              type: asset.type,
              content: asset.content,
              metadata: asset.metadata
            });
            
            if (newAsset) {
              stats.uploaded.assets++;
            }
          }
          
          // 콘텐츠 업로드
          const contents = getStorage<Content[]>(`contents_${localProject.id}`) || [];
          for (const content of contents) {
            const newContent = await createContent({
              projectId: newProject.id,
              name: content.name,
              html: content.html,
              markdown: content.markdown || '',
              assets: content.assets || [],
              metadata: content.metadata
            });
            
            if (newContent) {
              stats.uploaded.contents++;
            }
          }
        }
      }
    }
    
    // 5. Supabase에만 있는 프로젝트 다운로드
    for (const remoteProject of remoteProjects) {
      if (!localProjectMap.has(remoteProject.name)) {
        // 프로젝트 정보 저장
        const updatedProjects = [...localProjects, remoteProject];
        setStorage('projects', updatedProjects);
        stats.downloaded.projects++;
        
        // 에셋 다운로드
        const assets = await getProjectAssets(remoteProject.id);
        if (assets.length > 0) {
          setStorage(`assets_${remoteProject.id}`, assets);
          stats.downloaded.assets += assets.length;
        }
        
        // 콘텐츠 다운로드
        const contents = await getProjectContents(remoteProject.id);
        if (contents.length > 0) {
          setStorage(`contents_${remoteProject.id}`, contents);
          stats.downloaded.contents += contents.length;
        }
      }
    }
    
    return {
      success: true,
      message: `동기화 완료: ${stats.uploaded.projects}개 프로젝트 업로드, ${stats.downloaded.projects}개 프로젝트 다운로드됨`,
      stats
    };
  } catch (error) {
    console.error('동기화 오류:', error);
    return {
      success: false,
      message: `동기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`,
      stats: {
        uploaded: { projects: 0, assets: 0, contents: 0 },
        downloaded: { projects: 0, assets: 0, contents: 0 }
      }
    };
  }
}; 