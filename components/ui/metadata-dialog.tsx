"use client";

import { useState, useEffect } from 'react';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Textarea } from './textarea';
import { Badge } from './badge';
import { Separator } from './separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { MetadataManager, ImageMetadata } from '@/lib/metadata-manager';
import { Loader2, Info, Tag, Edit3, Save, FileBadge, X, Plus } from 'lucide-react';
import { bytesToSize } from '@/lib/utils';

export interface MetadataDialogProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (metadata: ImageMetadata) => void;
}

export function MetadataDialog({
  imageUrl,
  isOpen,
  onClose,
  onSave
}: MetadataDialogProps) {
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 메타데이터 상태
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);
  const [editableMetadata, setEditableMetadata] = useState<Partial<ImageMetadata>>({});
  
  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // 태그 관리 상태
  const [newTag, setNewTag] = useState<string>('');
  
  // 메타데이터 로드
  useEffect(() => {
    if (imageUrl && isOpen) {
      loadMetadata();
    }
  }, [imageUrl, isOpen]);
  
  // 메타데이터 로드 함수
  const loadMetadata = async () => {
    setIsLoading(true);
    try {
      // 메타데이터 추출
      const extractedMetadata = await MetadataManager.extractMetadata(imageUrl, {
        extractColors: true,
        maxColors: 5,
        includeExif: true,
        includeIptc: true
      });
      
      setMetadata(extractedMetadata);
      setEditableMetadata({
        title: extractedMetadata.title || '',
        description: extractedMetadata.description || '',
        alt: extractedMetadata.alt || '',
        credit: extractedMetadata.credit || '',
        tags: [...(extractedMetadata.tags || [])]
      });
    } catch (error) {
      console.error('메타데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 편집 모드 전환
  const toggleEditMode = () => {
    if (isEditMode) {
      // 편집 모드 종료 시 원본 데이터로 복원
      if (metadata) {
        setEditableMetadata({
          title: metadata.title || '',
          description: metadata.description || '',
          alt: metadata.alt || '',
          credit: metadata.credit || '',
          tags: [...(metadata.tags || [])]
        });
      }
    }
    setIsEditMode(!isEditMode);
  };
  
  // 메타데이터 필드 변경 핸들러
  const handleMetadataChange = (field: keyof ImageMetadata, value: any) => {
    setEditableMetadata(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 태그 추가 핸들러
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const tags = [...(editableMetadata.tags || [])];
    
    // 중복 태그 확인
    if (!tags.includes(newTag.trim())) {
      tags.push(newTag.trim());
      handleMetadataChange('tags', tags);
    }
    
    setNewTag('');
  };
  
  // 태그 삭제 핸들러
  const handleRemoveTag = (tag: string) => {
    const tags = [...(editableMetadata.tags || [])];
    const updatedTags = tags.filter(t => t !== tag);
    handleMetadataChange('tags', updatedTags);
  };
  
  // 메타데이터 저장 핸들러
  const handleSave = () => {
    if (!metadata) return;
    
    // 메타데이터 병합
    const updatedMetadata = MetadataManager.mergeMetadata(metadata, editableMetadata);
    
    // 콜백 호출
    if (onSave) {
      onSave(updatedMetadata);
    }
    
    // 상태 업데이트
    setMetadata(updatedMetadata);
    setIsEditMode(false);
  };
  
  // 색상 배지 렌더링
  const renderColorBadge = (color: string) => {
    const style = {
      backgroundColor: color,
      width: '24px',
      height: '24px',
      borderRadius: '50%',
      display: 'inline-block',
      marginRight: '4px',
      border: '1px solid rgba(0,0,0,0.1)'
    };
    
    return <span style={style} title={color}></span>;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>이미지 메타데이터</DialogTitle>
          <DialogDescription>
            이미지에 대한 메타데이터를 확인하고 편집할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">메타데이터 로드 중...</span>
          </div>
        ) : metadata ? (
          <div className="space-y-4">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">기본 정보</TabsTrigger>
                <TabsTrigger value="visual">시각적 정보</TabsTrigger>
                <TabsTrigger value="technical">기술적 정보</TabsTrigger>
              </TabsList>
              
              {/* 기본 정보 탭 */}
              <TabsContent value="basic" className="space-y-4 pt-4">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label htmlFor="title">제목</Label>
                        <Input 
                          id="title" 
                          value={editableMetadata.title || ''} 
                          onChange={(e) => handleMetadataChange('title', e.target.value)}
                          placeholder="이미지 제목을 입력하세요"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="alt">대체 텍스트</Label>
                        <Input 
                          id="alt" 
                          value={editableMetadata.alt || ''} 
                          onChange={(e) => handleMetadataChange('alt', e.target.value)}
                          placeholder="접근성을 위한 대체 텍스트를 입력하세요"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">설명</Label>
                        <Textarea 
                          id="description" 
                          value={editableMetadata.description || ''} 
                          onChange={(e) => handleMetadataChange('description', e.target.value)}
                          placeholder="이미지에 대한 설명을 입력하세요"
                          rows={3}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="credit">출처/크레딧</Label>
                        <Input 
                          id="credit" 
                          value={editableMetadata.credit || ''} 
                          onChange={(e) => handleMetadataChange('credit', e.target.value)}
                          placeholder="이미지 출처 또는 저작권자를 입력하세요"
                        />
                      </div>
                      
                      <div>
                        <Label>태그</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(editableMetadata.tags || []).map(tag => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button 
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 rounded-full hover:bg-muted p-1"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input 
                            value={newTag} 
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="새 태그 추가"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          />
                          <Button size="sm" onClick={handleAddTag}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <p className="text-sm font-medium">제목</p>
                        <p className="text-sm text-muted-foreground">
                          {metadata.title || '(없음)'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">크기</p>
                        <p className="text-sm text-muted-foreground">
                          {metadata.width} × {metadata.height} 픽셀
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">대체 텍스트</p>
                      <p className="text-sm text-muted-foreground">
                        {metadata.alt || '(없음)'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">설명</p>
                      <p className="text-sm text-muted-foreground">
                        {metadata.description || '(없음)'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">출처/크레딧</p>
                      <p className="text-sm text-muted-foreground">
                        {metadata.credit || '(없음)'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">태그</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {metadata.tags && metadata.tags.length > 0 ? (
                          metadata.tags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">(없음)</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">생성 일자</p>
                        <p className="text-sm text-muted-foreground">
                          {metadata.created 
                            ? new Date(metadata.created).toLocaleString() 
                            : '(없음)'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">수정 일자</p>
                        <p className="text-sm text-muted-foreground">
                          {metadata.modified 
                            ? new Date(metadata.modified).toLocaleString() 
                            : '(없음)'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* 시각적 정보 탭 */}
              <TabsContent value="visual" className="space-y-4 pt-4">
                {/* 주요 색상 */}
                <div>
                  <p className="text-sm font-medium mb-2">주요 색상</p>
                  <div className="flex items-center gap-2">
                    {metadata.colors && metadata.colors.length > 0 ? (
                      metadata.colors.map((color, index) => (
                        <div key={index} className="flex flex-col items-center">
                          {renderColorBadge(color)}
                          <span className="text-xs mt-1">{color}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">(색상 정보 없음)</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                {/* 미리보기 */}
                <div>
                  <p className="text-sm font-medium mb-2">이미지 미리보기</p>
                  <div className="rounded-md border overflow-hidden">
                    <img 
                      src={imageUrl} 
                      alt={metadata.alt || '이미지 미리보기'} 
                      className="w-full h-auto max-h-[300px] object-contain"
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* 기술적 정보 탭 */}
              <TabsContent value="technical" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">형식</p>
                    <p className="text-sm text-muted-foreground">
                      {metadata.format.toUpperCase()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">파일 크기</p>
                    <p className="text-sm text-muted-foreground">
                      {metadata.size ? bytesToSize(metadata.size) : '(알 수 없음)'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">해상도</p>
                    <p className="text-sm text-muted-foreground">
                      {metadata.width} × {metadata.height} 픽셀
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">종횡비</p>
                    <p className="text-sm text-muted-foreground">
                      {metadata.aspectRatio?.toFixed(2) || '(알 수 없음)'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* EXIF 데이터 (있는 경우) */}
                {metadata.custom?.exif && (
                  <div>
                    <p className="text-sm font-medium mb-2">EXIF 정보</p>
                    <div className="rounded-md border p-2 bg-muted/30">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(metadata.custom.exif, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* IPTC 데이터 (있는 경우) */}
                {metadata.custom?.iptc && (
                  <div>
                    <p className="text-sm font-medium mb-2">IPTC 정보</p>
                    <div className="rounded-md border p-2 bg-muted/30">
                      <pre className="text-xs overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(metadata.custom.iptc, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {/* 전체 메타데이터 */}
                <div>
                  <p className="text-sm font-medium mb-2">전체 메타데이터</p>
                  <div className="rounded-md border p-2 bg-muted/30 max-h-[200px] overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>메타데이터를 로드할 수 없습니다.</p>
          </div>
        )}
        
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
          
          {metadata && (
            isEditMode ? (
              <>
                <Button variant="secondary" onClick={toggleEditMode}>
                  취소
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </Button>
              </>
            ) : (
              <Button onClick={toggleEditMode}>
                <Edit3 className="h-4 w-4 mr-2" />
                편집
              </Button>
            )
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 