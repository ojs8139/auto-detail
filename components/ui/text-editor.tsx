"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TextEditorProps {
  initialValue?: string;
  onSave: (text: string) => void;
  className?: string;
  placeholder?: string;
  minHeight?: string;
}

export function TextEditor({
  initialValue = "",
  onSave,
  className = "",
  placeholder = "제품 설명을 입력하세요...",
  minHeight = "200px",
}: TextEditorProps) {
  const [text, setText] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(!initialValue);

  // 텍스트 변경 핸들러
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // 저장 핸들러
  const handleSave = () => {
    onSave(text);
    setIsEditing(false);
  };

  // 파일로부터 텍스트 불러오기
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.type === "text/plain") {
        // 텍스트 파일 처리
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setText(event.target.result as string);
          }
        };
        reader.readAsText(file);
      } else {
        // 지원하지 않는 파일 형식
        alert("지원하지 않는 파일 형식입니다. 텍스트(.txt) 파일만 지원합니다.");
      }
      
      // 같은 파일을 다시 선택할 수 있도록 input 값을 초기화
      e.target.value = "";
    }
  };

  return (
    <div className={`flex flex-col space-y-2 ${className}`}>
      {isEditing ? (
        <div className="flex flex-col space-y-2">
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder={placeholder}
            className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ minHeight }}
          />
          <div className="flex justify-between">
            <div>
              <input
                type="file"
                id="text-file-upload"
                className="hidden"
                accept=".txt"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("text-file-upload")?.click()}
              >
                파일에서 불러오기
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setText(initialValue);
                  setIsEditing(false);
                }}
              >
                취소
              </Button>
              <Button type="button" onClick={handleSave}>
                저장
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-2">
          <div
            className="border rounded-md p-4 whitespace-pre-wrap text-sm"
            style={{ minHeight }}
          >
            {text || <span className="text-muted-foreground">내용 없음</span>}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
            >
              편집
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 