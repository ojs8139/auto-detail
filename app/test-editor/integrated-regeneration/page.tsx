"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image, History, CheckCircle, AlertTriangle } from "lucide-react";

/**
 * 통합 재생성 테스트 페이지
 * 구현된 모든 기능을 테스트할 수 있는 링크를 제공합니다.
 */
export default function IntegratedRegenerationPage() {
  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-3xl font-bold mb-4">부분 재생성 기능 통합 테스트</h1>
      <p className="text-lg mb-8">
        아래 카드에서 각각의 기능을 테스트해보세요.
      </p>
      
      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="features">주요 기능</TabsTrigger>
          <TabsTrigger value="validation">검증 테스트</TabsTrigger>
          <TabsTrigger value="summary">기능 요약</TabsTrigger>
        </TabsList>
        
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 요소 선택 메커니즘 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  요소 선택 메커니즘
                </CardTitle>
                <CardDescription>
                  캔버스에서 텍스트와 이미지 요소를 선택하는 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  ElementSelector 컴포넌트를 통해 캔버스 내 요소를 선택할 수 있습니다.
                  다양한 선택 옵션과 도구를 제공합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* 컨텍스트 메뉴 통합 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  컨텍스트 메뉴 통합
                </CardTitle>
                <CardDescription>
                  우클릭 컨텍스트 메뉴를 통한 재생성 기능 접근
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  선택된 요소에 대해 다양한 재생성 옵션을 제공하는 컨텍스트 메뉴를
                  사용할 수 있습니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* 텍스트 재생성 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  텍스트 재생성
                </CardTitle>
                <CardDescription>
                  컨텍스트 보존을 통한 텍스트 재생성 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  키워드 추출, 서식 보존, 다양한 스타일 적용 등을 통해
                  텍스트를 재생성할 수 있습니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* 이미지 대체 기능 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Image className="h-5 w-5 mr-2" />
                  이미지 대체 기능
                </CardTitle>
                <CardDescription>
                  이미지 변형 및 대체 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  이미지 회전, 뒤집기, 필터 적용, 밝기/대비 조정 등
                  다양한 변형 기능을 제공합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* 재생성 옵션 UI */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  재생성 옵션 UI
                </CardTitle>
                <CardDescription>
                  다양한 재생성 옵션을 설정하는 UI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  고급 옵션, 스타일 프리셋, 미리보기 기능 등을 통해
                  세밀한 재생성 설정이 가능합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* 히스토리 관리 시스템 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  히스토리 관리 시스템
                </CardTitle>
                <CardDescription>
                  재생성 히스토리 관리 및 롤백 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  이전 버전으로 롤백하거나 재생성 히스토리를 확인할 수 있는
                  관리 시스템을 제공합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="validation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 컨텍스트 일관성 검증 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  컨텍스트 일관성 검증
                </CardTitle>
                <CardDescription>
                  재생성 결과의 컨텍스트 일관성 검증 기능
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  재생성된 콘텐츠가 원본의 컨텍스트와 스타일을 유지하는지
                  자동으로 검증하는 기능을 테스트합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
            
            {/* 통합 및 테스트 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  통합 및 테스트
                </CardTitle>
                <CardDescription>
                  모든 기능의 통합 테스트
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  선택, 재생성, 옵션, 히스토리, 검증 등 모든 기능이
                  원활하게 통합되어 작동하는지 확인합니다.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/test-editor/element-regeneration" passHref>
                  <Button className="w-full">테스트하기</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>구현 기능 요약</CardTitle>
              <CardDescription>
                부분 재생성 기능 구현 작업의 주요 기능을 요약합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">주요 컴포넌트</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>ElementSelector: 캔버스 요소 선택 기능</li>
                    <li>RegenerationOptions: 재생성 옵션 설정 UI</li>
                    <li>RegenerationResult: 재생성 결과 표시 컴포넌트</li>
                    <li>RegenerationHistory: 히스토리 관리 컴포넌트</li>
                    <li>ConsistencyValidationUI: 일관성 검증 결과 표시</li>
                    <li>ImageTransformControls: 이미지 변형 컨트롤</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">서비스 및 유틸리티</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>RegenerationService: 재생성 기능 핵심 서비스</li>
                    <li>ValidationService: 컨텍스트 일관성 검증 서비스</li>
                    <li>ConsistencyValidator: 일관성 검증 로직</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">테스트 페이지</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>element-regeneration: 개별 기능 테스트</li>
                    <li>integrated-regeneration: 통합 기능 테스트</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
} 