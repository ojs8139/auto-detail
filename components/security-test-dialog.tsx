"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityTester, VulnerabilityScanner } from "@/lib/security-test";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

interface TestGroup {
  name: string;
  results: TestResult[];
  passCount: number;
  failCount: number;
}

export function SecurityTestDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestGroup[]>([]);
  const [vulnerabilityResults, setVulnerabilityResults] = useState<TestResult[]>([]);
  const [activeTab, setActiveTab] = useState("functional-tests");
  
  const totalTests = testResults.reduce((count, group) => count + group.results.length, 0) + vulnerabilityResults.length;
  const passedTests = testResults.reduce((count, group) => count + group.passCount, 0) + 
                      vulnerabilityResults.filter(r => r.passed).length;
  
  // 보안 테스트 실행
  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    setVulnerabilityResults([]);
    
    try {
      // 기능 테스트
      const results = await SecurityTester.runAllTests();
      setTestResults(results);
      
      // 취약점 검사
      const vulnResults: TestResult[] = [];
      
      // XSS 취약점 검사
      vulnResults.push(VulnerabilityScanner.checkXSS('<p>안전한 HTML</p><script>alert("XSS");</script>'));
      
      // SQL 인젝션 취약점 검사
      vulnResults.push(VulnerabilityScanner.checkSQLInjection("SELECT * FROM users WHERE name = 'test'"));
      vulnResults.push(VulnerabilityScanner.checkSQLInjection("SELECT * FROM users WHERE name = 'test' OR 1=1"));
      
      // CSRF 취약점 검사
      vulnResults.push(VulnerabilityScanner.checkCSRF('<form action="/api/data"><input name="data" /><button>제출</button></form>'));
      vulnResults.push(VulnerabilityScanner.checkCSRF('<form action="/api/data"><input name="_csrf" value="token" /><button>제출</button></form>'));
      
      // 암호화 취약점 검사
      const originalText = "테스트 데이터";
      const encryptedText = "U2FsdGVkX1+ABCDEFGhijklmnop=="; // 가상의 암호화 문자열
      vulnResults.push(VulnerabilityScanner.checkEncryption(encryptedText, originalText));
      
      // 입력 검증 취약점 검사
      vulnResults.push(VulnerabilityScanner.checkInputValidation("test@example.com", "email"));
      vulnResults.push(VulnerabilityScanner.checkInputValidation("invalid-email", "email"));
      vulnResults.push(VulnerabilityScanner.checkInputValidation("https://example.com", "url"));
      vulnResults.push(VulnerabilityScanner.checkInputValidation("weak", "password"));
      vulnResults.push(VulnerabilityScanner.checkInputValidation("Strong1@Password", "password"));
      
      // 보안 헤더 취약점 검사
      const mockHeaders = {
        'Content-Security-Policy': "default-src 'self'",
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      };
      
      vulnResults.push(...VulnerabilityScanner.checkSecurityHeaders(mockHeaders));
      
      setVulnerabilityResults(vulnResults);
    } catch (error) {
      console.error('보안 테스트 실행 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">보안 테스트 실행</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>보안 및 데이터 보호 테스트</DialogTitle>
          <DialogDescription>
            애플리케이션의 보안 기능을 테스트하고 취약점을 검사합니다.
          </DialogDescription>
        </DialogHeader>
        
        {testResults.length === 0 && vulnerabilityResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p>보안 테스트 실행 중...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <p>테스트를 시작하려면 아래 버튼을 클릭하세요.</p>
                <Button onClick={runTests}>테스트 시작</Button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">
                  테스트 결과: {passedTests}/{totalTests} 통과 ({Math.round((passedTests / totalTests) * 100)}%)
                </p>
              </div>
              <Button onClick={runTests} disabled={isLoading} size="sm">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    테스트 중...
                  </>
                ) : (
                  "테스트 다시 실행"
                )}
              </Button>
            </div>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="functional-tests" className="flex-1">기능 테스트</TabsTrigger>
                <TabsTrigger value="vulnerability-tests" className="flex-1">취약점 검사</TabsTrigger>
              </TabsList>
              
              <TabsContent value="functional-tests" className="space-y-4 mt-4">
                {testResults.map((group, groupIndex) => (
                  <div key={groupIndex} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{group.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {group.passCount}
                        </span>
                        <span className="text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          {group.failCount}
                        </span>
                      </div>
                    </div>
                    <Separator className="my-2" />
                    <div className="space-y-2">
                      {group.results.map((result, resultIndex) => (
                        <div key={resultIndex} className="flex items-start gap-2 text-sm">
                          {result.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="font-medium">{result.name}</p>
                            <p className="text-muted-foreground text-xs">{result.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="vulnerability-tests" className="space-y-4 mt-4">
                {vulnerabilityResults.map((result, index) => (
                  <Alert key={index} variant={result.passed ? "default" : "destructive"}>
                    <div className="flex items-start gap-2">
                      {result.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5" />
                      )}
                      <div>
                        <AlertTitle>{result.name}</AlertTitle>
                        <AlertDescription>{result.message}</AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 